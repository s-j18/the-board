"use client"
import { useState } from "react"
import { GamePlayer } from "@/lib/types"
import styles from "./Lobby.module.css"

interface Props {
  players: GamePlayer[]
  roomId: string
  isHost: boolean
  onStart: (cols: number, rows: number) => void
}

export function Lobby({ players, roomId, isHost, onStart }: Props) {
  const [cols, setCols] = useState(5)
  const [rows, setRows] = useState(5)

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${roomId}?name=`
    : ""

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>Waiting for players</h2>

      <div className={styles.invite}>
        <p>Share this room code with friends:</p>
        <div className={styles.code}>{roomId}</div>
        <button
          className={styles.copyBtn}
          onClick={() => navigator.clipboard.writeText(inviteUrl)}
        >
          Copy invite link
        </button>
      </div>

      <div className={styles.players}>
        {players.map(p => (
          <div key={p.id} className={styles.playerRow}>
            <span className={styles.dot} data-index={p.playerIndex} />
            <span>{p.name}</span>
            {!p.connected && <span className={styles.away}>(away)</span>}
          </div>
        ))}
        {players.length < 4 && (
          <div className={styles.playerRow} style={{ opacity: 0.35 }}>
            <span className={styles.dot} />
            <span>Waiting…</span>
          </div>
        )}
      </div>

      {isHost && (
        <div className={styles.settings}>
          <h3>Board size</h3>
          <div className={styles.sliders}>
            <label>
              Columns: <strong>{cols}</strong>
              <input
                type="range" min={3} max={12} value={cols}
                onChange={e => setCols(Number(e.target.value))}
              />
            </label>
            <label>
              Rows: <strong>{rows}</strong>
              <input
                type="range" min={3} max={12} value={rows}
                onChange={e => setRows(Number(e.target.value))}
              />
            </label>
          </div>
          <p className={styles.tileCount}>
            {cols * rows} tiles total
          </p>
          <button
            className={styles.startBtn}
            onClick={() => onStart(cols, rows)}
            disabled={players.length < 1}
          >
            Start game
          </button>
        </div>
      )}

      {!isHost && (
        <p className={styles.waiting}>Waiting for the host to start the game…</p>
      )}
    </div>
  )
}
