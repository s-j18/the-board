import { GamePlayer } from "@/lib/types"
import styles from "./Scoreboard.module.css"
import clsx from "clsx"

const COLORS = ["", "p1", "p2", "p3", "p4"] as const

interface Props {
  players: GamePlayer[]
  currentTurn: string
  myId: string
}

export function Scoreboard({ players, currentTurn, myId }: Props) {
  return (
    <div className={styles.wrap}>
      {players.map(p => (
        <div
          key={p.id}
          className={clsx(
            styles.player,
            styles[COLORS[p.playerIndex]],
            p.id === currentTurn && styles.active,
            !p.connected && styles.disconnected,
          )}
        >
          <span className={styles.name}>
            {p.name}{p.id === myId ? " (you)" : ""}
          </span>
          <span className={styles.score}>{p.score}</span>
        </div>
      ))}
    </div>
  )
}
