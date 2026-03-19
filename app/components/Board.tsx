import { Board as BoardType, TileOwner } from "@/lib/types"
import styles from "./Board.module.css"
import clsx from "clsx"

const PLAYER_COLORS = ["", "p1", "p2", "p3", "p4"] as const

interface Props {
  board: BoardType
  owners: TileOwner[]
  selectedTiles: number[]
  onTileClick: (id: number) => void
  playerCount: number
}

export function Board({ board, owners, selectedTiles, onTileClick, playerCount }: Props) {
  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }}
    >
      {board.tiles.map((tile) => {
        const owner = owners[tile.id]
        const selected = selectedTiles.includes(tile.id)
        const ownerColor = owner > 0 ? PLAYER_COLORS[owner] : null

        return (
          <button
            key={tile.id}
            className={clsx(
              styles.tile,
              ownerColor && styles[ownerColor],
              selected && styles.selected,
            )}
            onClick={() => onTileClick(tile.id)}
            title={tile.label}
          >
            <span className={styles.tileType}>
              {tile.type === "nation" ? "🌍" : "⚽"}
            </span>
            <span className={styles.tileLabel}>{tile.label}</span>
          </button>
        )
      })}
    </div>
  )
}
