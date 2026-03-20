// ── Tile ─────────────────────────────────────────────────────────────────────
export interface Tile {
  id: number
  label: string
  type: "club" | "nation"
  tags: string[]
  tmClubId?: string
  flagCode?: string
}

// ── Board ─────────────────────────────────────────────────────────────────────
export type League = "premier_league" | "championship" | "la_liga" | "bundesliga" | "serie_a" | "ligue_1" | "eredivisie" | "other_europe"

export interface BoardFilters {
  englishWeight: number
  leagues: League[]
  includeNations: boolean
}

export const DEFAULT_FILTERS: BoardFilters = {
  englishWeight: 70,
  leagues: ["premier_league", "championship", "la_liga", "bundesliga", "serie_a", "ligue_1", "other_europe"],
  includeNations: true,
}

export interface Board {
  tiles: Tile[]
  cols: number
  rows: number
}

// ── Player ───────────────────────────────────────────────────────────────────
export interface Player {
  id: string
  name: string
  searchName: string
  clubIds: string[]
  tags: string[]
  nationality: string[]
}

// ── Game state ────────────────────────────────────────────────────────────────
export type TileOwner = 0 | 1 | 2 | 3 | 4

export interface GamePlayer {
  id: string
  name: string
  score: number
  playerIndex: 1 | 2 | 3 | 4
  connected: boolean
  lockedOut: boolean
}

export type GamePhase = "lobby" | "playing" | "finished"

export interface GameState {
  roomId: string
  phase: GamePhase
  board: Board
  owners: TileOwner[]
  players: GamePlayer[]
  currentTurn: string
  consecutivePasses: number
  lastAction?: string
}

// ── WebSocket messages (client → server) ─────────────────────────────────────
export type ClientMessage =
  | { type: "join"; playerName: string; sessionId: string }
  | { type: "start"; cols: number; rows: number; filters: BoardFilters }
  | { type: "claim_valid"; tileIds: number[]; playerName: string; clubIds: string[]; tags: string[] }
  | { type: "claim_invalid"; message: string }
  | { type: "pass" }
  | { type: "kick"; playerId: string }
  | { type: "restart" }

// ── WebSocket messages (server → client) ─────────────────────────────────────
export type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "error"; message: string }
  | { type: "claimResult"; success: boolean; message: string; newOwners?: TileOwner[] }
