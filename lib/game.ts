import { Board, GameState, Player, TileOwner } from "./types"

// ── Grid helpers ──────────────────────────────────────────────────────────────

export function tilePos(id: number, cols: number) {
  return { r: Math.floor(id / cols), c: id % cols }
}

export function getNeighbours(id: number, cols: number, rows: number): number[] {
  const { r, c } = tilePos(id, cols)
  const neighbours: number[] = []
  if (r > 0)        neighbours.push((r - 1) * cols + c)
  if (r < rows - 1) neighbours.push((r + 1) * cols + c)
  if (c > 0)        neighbours.push(r * cols + (c - 1))
  if (c < cols - 1) neighbours.push(r * cols + (c + 1))
  return neighbours
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

export function playerMatchesTile(player: Player, tileId: number, board: Board): boolean {
  const tile = board.tiles[tileId]
  if (!tile) return false
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
  currentPlayerId: string,
  playerIndex: TileOwner,
  state: GameState
): ClaimResult {
  const { board, owners } = state

  // 1. Must select at least one tile
  if (tileIds.length === 0) {
    return { valid: false, message: "No tiles selected.", blankClaimed: [], opponentStolen: [], ownAlready: [] }
  }

  // 2. Tiles must form a contiguous shape
  if (!isContiguous(tileIds, board.cols, board.rows)) {
    return { valid: false, message: "Selected tiles must form a connected shape.", blankClaimed: [], opponentStolen: [], ownAlready: [] }
  }

  // 3. Every tile must connect to this player
  for (const id of tileIds) {
    if (!playerMatchesTile(player, id, board)) {
      return {
        valid: false,
        message: `${player.name} has no connection to "${board.tiles[id].label}".`,
        blankClaimed: [], opponentStolen: [], ownAlready: []
      }
    }
  }

  // 4. Categorise tiles
  const blankClaimed = tileIds.filter(id => owners[id] === 0)
  const ownAlready   = tileIds.filter(id => owners[id] === playerIndex)
  const opponentStolen = tileIds.filter(id => owners[id] !== 0 && owners[id] !== playerIndex)

  // 5. Must gain at least one blank tile
  if (blankClaimed.length === 0 && opponentStolen.length === 0) {
    return { valid: false, message: "You already own all those tiles.", blankClaimed: [], opponentStolen: [], ownAlready }
  }

  // 6. Steal rule: blank tiles gained must exceed opponent tiles stolen
  if (opponentStolen.length > 0 && blankClaimed.length <= opponentStolen.length) {
    return {
      valid: false,
      message: `Steal blocked! You'd gain ${blankClaimed.length} blank tile(s) but steal ${opponentStolen.length} — you need more blank tiles than stolen tiles.`,
      blankClaimed, opponentStolen, ownAlready
    }
  }

  return { valid: true, message: "Claim valid.", blankClaimed, opponentStolen, ownAlready }
}

// ── Apply a valid claim to game state ─────────────────────────────────────────

export function applyClaim(
  tileIds: number[],
  playerIndex: TileOwner,
  result: ClaimResult,
  state: GameState
): GameState {
  const newOwners = [...state.owners] as TileOwner[]
  for (const id of tileIds) {
    newOwners[id] = playerIndex
  }

  const newPlayers = state.players.map(p => {
    if (p.playerIndex === playerIndex) {
      return { ...p, score: p.score + result.blankClaimed.length }
    }
    // Deduct stolen tiles from opponent(s)
    const stolen = result.opponentStolen.filter(id => state.owners[id] === p.playerIndex).length
    if (stolen > 0) {
      return { ...p, score: p.score - stolen }
    }
    return p
  })

  return {
    ...state,
    owners: newOwners,
    players: newPlayers,
    consecutivePasses: 0,
  }
}

// ── Check if the game should end ──────────────────────────────────────────────

export function isGameOver(state: GameState): boolean {
  // All tiles claimed
  if (state.owners.every(o => o !== 0)) return true
  // All players have passed twice in a row
  if (state.consecutivePasses >= state.players.length * 2) return true
  return false
}

// ── Get next player id ────────────────────────────────────────────────────────

export function nextTurn(state: GameState): string {
  const connected = state.players.filter(p => p.connected)
  if (connected.length === 0) return state.currentTurn
  const idx = connected.findIndex(p => p.id === state.currentTurn)
  return connected[(idx + 1) % connected.length].id
}
