// ── Tile ─────────────────────────────────────────────────────────────────────
export interface Tile {
  id: number
  label: string
  type: "club" | "nation"
  tags: string[]        // normalised name tags for matching
  tmClubId?: string     // Transfermarkt club ID (backend only, never shown to user)
  flagCode?: string     // ISO code for nations
}

// ── Board ─────────────────────────────────────────────────────────────────────
export type League = "premier_league" | "championship" | "la_liga" | "bundesliga" | "serie_a" | "ligue_1" | "eredivisie" | "other_europe"

export interface BoardFilters {
  englishWeight: number       // 0–100, percentage of tiles that are English clubs
  leagues: League[]           // which leagues to include
  includeNations: boolean
}

export interface BoardConfig {
  cols: number
  rows: number
  filters: BoardFilters
}

export interface Board {
  tiles: Tile[]
  cols: number
  rows: number
}

// ── Player ───────────────────────────────────────────────────────────────────
export interface Player {
  id: string            // Transfermarkt player ID
  name: string          // Display name e.g. "Petr Čech"
  searchName: string    // Normalised e.g. "petr cech"
  clubIds: string[]     // Transfermarkt club IDs from career history
  tags: string[]        // Normalised name tags (fallback matching)
  nationality: string[]
}

// ── Game state ────────────────────────────────────────────────────────────────
export type TileOwner = 0 | 1 | 2 | 3 | 4  // 0 = unclaimed

export interface GamePlayer {
  id: string
  name: string
  score: number
  playerIndex: 1 | 2 | 3 | 4
  connected: boolean
  lockedOut: boolean    // locked out until next turn after wrong answer
}

export type GamePhase = "lobby" | "playing" | "finished"

export interface GameState {
  roomId: string
  phase: GamePhase
  board: Board
  owners: TileOwner[]
  players: GamePlayer[]
  currentTurn: string   // player id
  consecutivePasses: number
  lastAction?: string
}

// ── WebSocket messages (client → server) ─────────────────────────────────────
export type ClientMessage =
  | { type: "join"; playerName: string; sessionId: string }
  | { type: "start"; cols: number; rows: number; filters: BoardFilters }
  | { type: "claim"; tileIds: number[]; playerName: string }
  | { type: "pass" }
  | { type: "kick"; playerId: string }

// ── WebSocket messages (server → client) ─────────────────────────────────────
export type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "error"; message: string }
  | { type: "claimResult"; success: boolean; message: string; newOwners?: TileOwner[] }

export const DEFAULT_FILTERS: BoardFilters = {
  englishWeight: 70,
  leagues: ["premier_league", "championship", "la_liga", "bundesliga", "serie_a", "ligue_1", "other_europe"],
  includeNations: true,
}
