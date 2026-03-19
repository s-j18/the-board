import type * as Party from "partykit/server"
import { ClientMessage, GameState, GamePlayer, ServerMessage, TileOwner } from "../lib/types"
import { generateBoard } from "../lib/board"
import { validateClaim, applyClaim, isGameOver, nextTurn } from "../lib/game"
import { getPlayerCareer, normalise } from "../lib/player"

export default class BoardServer implements Party.Server {
  state: GameState | null = null

  constructor(readonly room: Party.Room) {}

  // ── Broadcast to all connections ──────────────────────────────────────────
  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  // ── New connection ────────────────────────────────────────────────────────
  onConnect(conn: Party.Connection) {
    // Send current state to newly connected player
    if (this.state) {
      this.send(conn, { type: "state", state: this.state })
    }
  }

  // ── Connection closed ─────────────────────────────────────────────────────
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

  // ── Message handler ───────────────────────────────────────────────────────
  async onMessage(raw: string, conn: Party.Connection) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    switch (msg.type) {
      case "join":
        await this.handleJoin(conn, msg.playerName)
        break
      case "start":
        await this.handleStart(conn, msg.cols, msg.rows)
        break
      case "claim":
        await this.handleClaim(conn, msg.tileIds, msg.playerName)
        break
      case "pass":
        this.handlePass(conn)
        break
    }
  }

  // ── Join ──────────────────────────────────────────────────────────────────
  async handleJoin(conn: Party.Connection, playerName: string) {
    if (!this.state) {
      // First player — create lobby state with a default board
      this.state = {
        roomId: this.room.id,
        phase: "lobby",
        board: generateBoard(5, 5),
        owners: Array(25).fill(0) as TileOwner[],
        players: [],
        currentTurn: conn.id,
        consecutivePasses: 0,
      }
    }

    if (this.state.phase !== "lobby") {
      this.send(conn, { type: "error", message: "Game already in progress." })
      return
    }

    if (this.state.players.length >= 4) {
      this.send(conn, { type: "error", message: "Room is full (max 4 players)." })
      return
    }

    // Check if reconnecting
    const existing = this.state.players.find(p => p.id === conn.id)
    if (existing) {
      this.state = {
        ...this.state,
        players: this.state.players.map(p =>
          p.id === conn.id ? { ...p, connected: true } : p
        ),
      }
    } else {
      const playerIndex = (this.state.players.length + 1) as 1 | 2 | 3 | 4
      const newPlayer: GamePlayer = {
        id: conn.id,
        name: playerName,
        score: 0,
        playerIndex,
        connected: true,
      }
      this.state = {
        ...this.state,
        players: [...this.state.players, newPlayer],
        currentTurn: this.state.players.length === 0 ? conn.id : this.state.currentTurn,
      }
    }

    this.broadcast({ type: "state", state: this.state })
  }

  // ── Start game ────────────────────────────────────────────────────────────
  async handleStart(conn: Party.Connection, cols: number, rows: number) {
    if (!this.state) return
    if (this.state.phase !== "lobby") {
      this.send(conn, { type: "error", message: "Game already started." })
      return
    }
    if (this.state.players.length < 1) {
      this.send(conn, { type: "error", message: "Need at least 1 player to start." })
      return
    }

    const clampedCols = Math.min(Math.max(cols, 3), 12)
    const clampedRows = Math.min(Math.max(rows, 3), 12)
    const board = generateBoard(clampedCols, clampedRows)

    this.state = {
      ...this.state,
      phase: "playing",
      board,
      owners: Array(clampedCols * clampedRows).fill(0) as TileOwner[],
      consecutivePasses: 0,
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

    // Fetch player career data from Transfermarkt API
    // First search for the player, then get their career
    let tmPlayer = null
    try {
      const res = await fetch(
        `${process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"}/players/search/${encodeURIComponent(playerName)}`
      )
      if (res.ok) {
        const data = await res.json()
        const results = data.results ?? []
        if (results.length > 0) {
          const { id } = results[0]
          tmPlayer = await getPlayerCareer(id)
        }
      }
    } catch {
      this.send(conn, { type: "error", message: "Could not reach player database. Try again." })
      return
    }

    if (!tmPlayer) {
      this.send(conn, { type: "error", message: `Player "${playerName}" not found.` })
      return
    }

    const result = validateClaim(
      tileIds,
      tmPlayer,
      conn.id,
      gamePlayer.playerIndex,
      this.state
    )

    if (!result.valid) {
      this.send(conn, { type: "claimResult", success: false, message: result.message })
      return
    }

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

    const newPasses = this.state.consecutivePasses + 1
    this.state = {
      ...this.state,
      consecutivePasses: newPasses,
      currentTurn: nextTurn(this.state),
    }

    if (isGameOver(this.state)) {
      this.state = { ...this.state, phase: "finished" }
    }

    this.broadcast({ type: "state", state: this.state })
  }
}

BoardServer satisfies Party.Worker
