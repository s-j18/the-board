import { Board, GameState, Player, TileOwner } from "./types"

// ── Grid helpers ──────────────────────────────────────────────────────────────
export function tilePos(id: number, cols: number) {
  return { r: Math.floor(id / cols), c: id % cols }
}

export function getNeighbours(id: number, cols: number, rows: number): number[] {
  const { r, c } = tilePos(id, cols)
  const out: number[] = []
  if (r > 0)        out.push((r - 1) * cols + c)
  if (r < rows - 1) out.push((r + 1) * cols + c)
  if (c > 0)        out.push(r * cols + (c - 1))
  if (c < cols - 1) out.push(r * cols + (c + 1))
  return out
}

export function isContiguous(ids: number[], cols: number, rows: number): boolean {
  if (ids.length <= 1) return true
  const set = new Set(ids)
  const visited = new Set<number>([ids[0]])
  const queue = [ids[0]]
  while (queue.length) {
    const cur = queue.shift()!
    for (const n of getNeighbours(cur, cols, rows)) {
      if (set.has(n) && !visited.has(n)) {
        visited.add(n)
        queue.push(n)
      }
    }
  }
  return visited.size === ids.length
}

// ── Player ↔ Tile matching ────────────────────────────────────────────────────
// Primary match: Transfermarkt club ID (exact, reliable)
// Fallback match: normalised name tags (for nations and any edge cases)
export function playerMatchesTile(player: Player, tileId: number, board: Board): boolean {
  const tile = board.tiles[tileId]
  if (!tile) return false

  if (tile.type === "club" && tile.tmClubId) {
    return player.clubIds.includes(tile.tmClubId)
  }

  // Nations and fallback: match on tags
  return player.tags.some(pt => tile.tags.includes(pt))
}

// ── Claim validation ──────────────────────────────────────────────────────────
export interface ClaimResult {
  valid: boolean
  message: string
  blankClaimed: number[]
  opponentStolen: number[]
  ownAlready: number[]
}

export function validateClaim(
  tileIds: number[],
  player: Player,
  playerIndex: TileOwner,
  state: GameState
): ClaimResult {
  const { board, owners } = state
  const empty: ClaimResult = { valid: false, message: "", blankClaimed: [], opponentStolen: [], ownAlready: [] }

  if (tileIds.length === 0) {
    return { ...empty, message: "No tiles selected." }
  }

  if (!isContiguous(tileIds, board.cols, board.rows)) {
    return { ...empty, message: "Selected tiles must form a connected shape." }
  }

  for (const id of tileIds) {
    if (!playerMatchesTile(player, id, board)) {
      return { ...empty, message: `${player.name} has no connection to "${board.tiles[id].label}".` }
    }
  }

  const blankClaimed   = tileIds.filter(id => owners[id] === 0)
  const ownAlready     = tileIds.filter(id => owners[id] === playerIndex)
  const opponentStolen = tileIds.filter(id => owners[id] !== 0 && owners[id] !== playerIndex)

  if (blankClaimed.length === 0 && opponentStolen.length === 0) {
    return { ...empty, message: "You already own all those tiles.", ownAlready }
  }

  if (opponentStolen.length > 0 && blankClaimed.length <= opponentStolen.length) {
    return {
      ...empty,
      message: `Steal blocked! You'd gain ${blankClaimed.length} blank tile(s) but steal ${opponentStolen.length} — you need more blank tiles than stolen ones.`,
      blankClaimed, opponentStolen, ownAlready,
    }
  }

  return { valid: true, message: "Claim valid.", blankClaimed, opponentStolen, ownAlready }
}

// ── Apply a valid claim ───────────────────────────────────────────────────────
export function applyClaim(
  tileIds: number[],
  playerIndex: TileOwner,
  result: ClaimResult,
  state: GameState
): GameState {
  const newOwners = [...state.owners] as TileOwner[]
  for (const id of tileIds) newOwners[id] = playerIndex

  const newPlayers = state.players.map(p => {
    if (p.playerIndex === playerIndex) {
      return { ...p, score: p.score + result.blankClaimed.length, lockedOut: false }
    }
    const stolen = result.opponentStolen.filter(id => state.owners[id] === p.playerIndex).length
    return stolen > 0 ? { ...p, score: p.score - stolen } : p
  })

  return { ...state, owners: newOwners, players: newPlayers, consecutivePasses: 0 }
}

// ── Game over check ───────────────────────────────────────────────────────────
export function isGameOver(state: GameState): boolean {
  if (state.owners.every(o => o !== 0)) return true
  if (state.consecutivePasses >= state.players.filter(p => p.connected).length * 2) return true
  return false
}

// ── Next turn ─────────────────────────────────────────────────────────────────
export function nextTurn(state: GameState): string {
  const connected = state.players.filter(p => p.connected)
  if (connected.length === 0) return state.currentTurn
  const idx = connected.findIndex(p => p.id === state.currentTurn)
  return connected[(idx + 1) % connected.length].id
}

// ── Lock out current player and advance turn ──────────────────────────────────
export function applyWrongAnswer(state: GameState): GameState {
  const newPlayers = state.players.map(p =>
    p.id === state.currentTurn ? { ...p, lockedOut: true } : p
  )
  const next = nextTurn({ ...state, players: newPlayers })
  // Unlock the player who was locked out when it comes back around
  const unlockedPlayers = newPlayers.map(p =>
    p.id !== state.currentTurn ? { ...p, lockedOut: false } : p
  )
  return { ...state, players: unlockedPlayers, currentTurn: next }
}
