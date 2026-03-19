import type * as Party from "partykit/server"
import { ClientMessage, GameState, GamePlayer, ServerMessage, TileOwner, BoardFilters } from "../lib/types"
import { generateBoard, DEFAULT_FILTERS } from "../lib/board"
import { validateClaim, applyClaim, isGameOver, nextTurn, applyWrongAnswer } from "../lib/game"
import { getPlayerCareer, normalise } from "../lib/player"

const TM_BASE = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"

// Maps sessionId → connection id, so players can reconnect
const sessionMap = new Map<string, string>()

export default class BoardServer implements Party.Server {
  state: GameState | null = null

  constructor(readonly room: Party.Room) {}

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  onConnect(conn: Party.Connection) {
    if (this.state) {
      this.send(conn, { type: "state", state: this.state })
    }
  }

  onClose(conn: Party.Connection) {
    if (!this.state) return
    this.state = {
      ...this.state,
      players: this.state.players.map(p =>
        p.id === conn.id ? { ...p, connected: false } : p
      ),
    }
    this.broadcast({ type: "state", state: this.state })
  }

  async onMessage(raw: string, conn: Party.Connection) {
    let msg: ClientMessage
    try { msg = JSON.parse(raw) } catch { return }

    switch (msg.type) {
      case "join":  await this.handleJoin(conn, msg.playerName, msg.sessionId); break
      case "start": await this.handleStart(conn, msg.cols, msg.rows, msg.filters); break
      case "claim": await this.handleClaim(conn, msg.tileIds, msg.playerName); break
      case "pass":  this.handlePass(conn); break
      case "kick":  this.handleKick(conn, msg.playerId); break
    }
  }

  // ── Join / reconnect ──────────────────────────────────────────────────────
  async handleJoin(conn: Party.Connection, playerName: string, sessionId: string) {
    if (!this.state) {
      this.state = {
        roomId: this.room.id,
        phase: "lobby",
        board: generateBoard(5, 5, DEFAULT_FILTERS),
        owners: Array(25).fill(0) as TileOwner[],
        players: [],
        currentTurn: conn.id,
        consecutivePasses: 0,
      }
    }

    // Check if this sessionId belongs to an existing player (reconnect)
    const existingConnId = sessionMap.get(sessionId)
    const existingPlayer = existingConnId
      ? this.state.players.find(p => p.id === existingConnId)
      : null

    if (existingPlayer) {
      // Reconnect: update their connection id and mark connected
      sessionMap.set(sessionId, conn.id)
      this.state = {
        ...this.state,
        players: this.state.players.map(p =>
          p.id === existingConnId
            ? { ...p, id: conn.id, connected: true, lockedOut: false }
            : p
        ),
        currentTurn: this.state.currentTurn === existingConnId ? conn.id : this.state.currentTurn,
      }
      this.broadcast({ type: "state", state: this.state })
      return
    }

    // New player joining lobby
    if (this.state.phase !== "lobby") {
      this.send(conn, { type: "error", message: "Game already in progress." })
      return
    }

    if (this.state.players.length >= 4) {
      this.send(conn, { type: "error", message: "Room is full (max 4 players)." })
      return
    }

    sessionMap.set(sessionId, conn.id)
    const playerIndex = (this.state.players.length + 1) as 1 | 2 | 3 | 4
    const newPlayer: GamePlayer = {
      id: conn.id,
      name: playerName,
      score: 0,
      playerIndex,
      connected: true,
      lockedOut: false,
    }

    this.state = {
      ...this.state,
      players: [...this.state.players, newPlayer],
      currentTurn: this.state.players.length === 0 ? conn.id : this.state.currentTurn,
    }

    this.broadcast({ type: "state", state: this.state })
  }

  // ── Start game ────────────────────────────────────────────────────────────
  async handleStart(conn: Party.Connection, cols: number, rows: number, filters: BoardFilters) {
    if (!this.state) return
    if (this.state.phase !== "lobby") {
      this.send(conn, { type: "error", message: "Game already started." })
      return
    }
    if (this.state.players[0]?.id !== conn.id) {
      this.send(conn, { type: "error", message: "Only the host can start the game." })
      return
    }

    const clampedCols = Math.min(Math.max(cols, 3), 12)
    const clampedRows = Math.min(Math.max(rows, 3), 12)

    let board
    try {
      board = generateBoard(clampedCols, clampedRows, filters)
    } catch (e: any) {
      this.send(conn, { type: "error", message: e.message })
      return
    }

    this.state = {
      ...this.state,
      phase: "playing",
      board,
      owners: Array(clampedCols * clampedRows).fill(0) as TileOwner[],
      consecutivePasses: 0,
      players: this.state.players.map(p => ({ ...p, lockedOut: false })),
    }

    this.broadcast({ type: "state", state: this.state })
  }

  // ── Claim tiles ───────────────────────────────────────────────────────────
  async handleClaim(conn: Party.Connection, tileIds: number[], playerName: string) {
    if (!this.state || this.state.phase !== "playing") return

    if (this.state.currentTurn !== conn.id) {
      this.send(conn, { type: "error", message: "It's not your turn." })
      return
    }

    const gamePlayer = this.state.players.find(p => p.id === conn.id)
    if (!gamePlayer) return

    // Fetch player from Transfermarkt
    let tmPlayer = null
    try {
      const searchRes = await fetch(
        `${TM_BASE}/players/search/${encodeURIComponent(normalise(playerName))}`
      )
      if (searchRes.ok) {
        const data = await searchRes.json()
        const results = data.results ?? []
        if (results.length > 0) {
          tmPlayer = await getPlayerCareer(results[0].id)
        }
      }
    } catch {
      this.send(conn, { type: "error", message: "Could not reach player database. Try again." })
      return
    }

    if (!tmPlayer) {
      // Wrong answer — lock out and advance turn
      this.state = applyWrongAnswer(this.state)
      this.broadcast({ type: "claimResult", success: false, message: `"${playerName}" not found — turn skipped.` })
      this.broadcast({ type: "state", state: this.state })
      return
    }

    const result = validateClaim(tileIds, tmPlayer, gamePlayer.playerIndex, this.state)

    if (!result.valid) {
      // Wrong answer — lock out and advance turn
      this.state = applyWrongAnswer(this.state)
      this.broadcast({ type: "claimResult", success: false, message: `${result.message} Turn skipped.` })
      this.broadcast({ type: "state", state: this.state })
      return
    }

    // Valid claim
    this.state = applyClaim(tileIds, gamePlayer.playerIndex, result, this.state)

    let message = `${tmPlayer.name} claimed ${result.blankClaimed.length} tile(s)!`
    if (result.opponentStolen.length > 0) {
      message += ` Stole ${result.opponentStolen.length} from opponent(s)!`
    }

    if (isGameOver(this.state)) {
      this.state = { ...this.state, phase: "finished" }
    } else {
      this.state = { ...this.state, currentTurn: nextTurn(this.state) }
    }

    this.broadcast({ type: "claimResult", success: true, message, newOwners: this.state.owners })
    this.broadcast({ type: "state", state: this.state })
  }

  // ── Pass ──────────────────────────────────────────────────────────────────
  handlePass(conn: Party.Connection) {
    if (!this.state || this.state.phase !== "playing") return
    if (this.state.currentTurn !== conn.id) return

    this.state = {
      ...this.state,
      consecutivePasses: this.state.consecutivePasses + 1,
      currentTurn: nextTurn(this.state),
    }

    if (isGameOver(this.state)) {
      this.state = { ...this.state, phase: "finished" }
    }

    this.broadcast({ type: "state", state: this.state })
  }

  // ── Kick player (host only) ───────────────────────────────────────────────
  handleKick(conn: Party.Connection, playerId: string) {
    if (!this.state) return
    if (this.state.players[0]?.id !== conn.id) {
      this.send(conn, { type: "error", message: "Only the host can remove players." })
      return
    }

    this.state = {
      ...this.state,
      players: this.state.players.filter(p => p.id !== playerId),
    }

    // If it was that player's turn, advance
    if (this.state.currentTurn === playerId) {
      this.state = { ...this.state, currentTurn: nextTurn(this.state) }
    }

    this.broadcast({ type: "state", state: this.state })
  }
}

BoardServer satisfies Party.Worker
