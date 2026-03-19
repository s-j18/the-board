// ── Tile ─────────────────────────────────────────────────────────────────────
export interface Tile {
  id: number
  label: string
  type: "club" | "nation" | "competition"
  // Normalised tags used for player matching
  // e.g. ["arsenal", "england", "premier league"]
  tags: string[]
  // Transfermarkt club/competition ID (for logo URLs later)
  tmId?: string
  logoUrl?: string
  flagCode?: string // ISO 3166-1 alpha-2 for nations
}

// ── Board ─────────────────────────────────────────────────────────────────────
export interface BoardConfig {
  cols: number
  rows: number
}

export interface Board {
  tiles: Tile[]
  cols: number
  rows: number
}

// ── Player ───────────────────────────────────────────────────────────────────
export interface Player {
  id: string          // Transfermarkt player ID
  name: string        // Display name e.g. "Petr Čech"
  searchName: string  // Normalised e.g. "petr cech"
  tags: string[]      // Clubs, nations, competitions (normalised)
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
}

export type GamePhase = "lobby" | "playing" | "finished"

export interface GameState {
  roomId: string
  phase: GamePhase
  board: Board
  owners: TileOwner[]      // one entry per tile, indexed same as board.tiles
  players: GamePlayer[]
  currentTurn: string      // player id
  consecutivePasses: number
  lastAction?: string
}

// ── WebSocket messages (client → server) ─────────────────────────────────────
export type ClientMessage =
  | { type: "join"; playerName: string }
  | { type: "start"; cols: number; rows: number }
  | { type: "claim"; tileIds: number[]; playerName: string }
  | { type: "pass" }

// ── WebSocket messages (server → client) ─────────────────────────────────────
export type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "error"; message: string }
  | { type: "claimResult"; success: boolean; message: string; newOwners?: TileOwner[] }
