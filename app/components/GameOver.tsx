import { GamePlayer, Board as BoardType, TileOwner } from "@/lib/types"
import styles from "./GameOver.module.css"
import Link from "next/link"

const COLORS = ["", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b"]

interface Props {
  players: GamePlayer[]
  board: BoardType
  owners: TileOwner[]
}

export function GameOver({ players, board, owners }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]
  const isDraw = sorted.length > 1 && sorted[0].score === sorted[1].score

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>
        {isDraw ? "It's a draw!" : `${winner.name} wins!`}
      </h2>

      <div className={styles.scores}>
        {sorted.map((p, i) => (
          <div key={p.id} className={styles.row}>
            <span className={styles.rank}>#{i + 1}</span>
            <span
              className={styles.dot}
              style={{ background: COLORS[p.playerIndex] }}
            />
            <span className={styles.name}>{p.name}</span>
            <span className={styles.score}>{p.score} pts</span>
          </div>
        ))}
      </div>

      <Link href="/" className={styles.homeBtn}>
        Back to home
      </Link>
    </div>
  )
}
