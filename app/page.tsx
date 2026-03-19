"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"

function randomRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [error, setError] = useState("")

  function handleCreate() {
    if (!name.trim()) { setError("Enter your name first."); return }
    const room = randomRoomId()
    router.push(`/room/${room}?name=${encodeURIComponent(name.trim())}`)
  }

  function handleJoin() {
    if (!name.trim()) { setError("Enter your name first."); return }
    if (!roomCode.trim()) { setError("Enter a room code to join."); return }
    router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(name.trim())}`)
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>The Board</h1>
        <p className={styles.subtitle}>A multiplayer football tile game</p>

        <div className={styles.field}>
          <label className={styles.label}>Your name</label>
          <input
            className={styles.input}
            value={name}
            onChange={e => { setName(e.target.value); setError("") }}
            placeholder="e.g. Sam"
            maxLength={20}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
        </div>

        <button className={styles.btnPrimary} onClick={handleCreate}>
          Create new room
        </button>

        <div className={styles.divider}><span>or join existing</span></div>

        <div className={styles.field}>
          <label className={styles.label}>Room code</label>
          <input
            className={styles.input}
            value={roomCode}
            onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError("") }}
            placeholder="e.g. AB12C"
            maxLength={6}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
          />
        </div>

        <button className={styles.btnSecondary} onClick={handleJoin}>
          Join room
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.rules}>
          <h3>How to play</h3>
          <ol>
            <li>Select touching tiles on the board (any connected shape)</li>
            <li>Type a footballer who played for/at every selected tile</li>
            <li>Claim blank tiles — 1 point each</li>
            <li>Steal opponent tiles only if you gain more blank tiles than you steal</li>
            <li>Game ends when the board is full or both players pass twice</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
