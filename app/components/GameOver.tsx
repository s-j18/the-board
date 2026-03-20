import { GamePlayer, Board as BoardType, TileOwner } from "@/lib/types"
import styles from "./GameOver.module.css"

const COLORS = ["", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b"]

interface Props {
  players: GamePlayer[]
  board: BoardType
  owners: TileOwner[]
  isHost: boolean
  onRestart: () => void
}

export function GameOver({ players, board, owners, isHost, onRestart }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]
  const isDraw = sorted.length > 1 && sorted[0].score === sorted[1].score
  const claimedTiles = owners.filter(o => o !== 0).length

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>
        {isDraw ? "It's a draw!" : `${winner.name} wins! 🎉`}
      </h2>

      <p className={styles.boardStats}>
        {claimedTiles} of {board.tiles.length} tiles claimed
      </p>

      <div className={styles.scores}>
        {sorted.map((p, i) => {
          const tileCount = owners.filter(o => o === p.playerIndex).length
          return (
            <div key={p.id} className={`${styles.row} ${i === 0 ? styles.winner : ""}`}>
              <span className={styles.rank}>#{i + 1}</span>
              <span className={styles.dot} style={{ background: COLORS[p.playerIndex] }} />
              <span className={styles.name}>{p.name}</span>
              <span className={styles.tileCount}>{tileCount} tiles</span>
              <span className={styles.score}>{p.score} pts</span>
            </div>
          )
        })}
      </div>

      <div className={styles.actions}>
        {isHost ? (
          <button className={styles.restartBtn} onClick={onRestart}>
            Play again
          </button>
        ) : (
          <p className={styles.waitRestart}>Waiting for the host to start a new game…</p>
        )}
      </div>
    </div>
  )
}
