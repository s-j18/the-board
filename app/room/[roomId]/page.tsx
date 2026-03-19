"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import PartySocket from "partysocket"
import { GameState, ServerMessage } from "@/lib/types"
import { Board } from "@/app/components/Board"
import { PlayerInput } from "@/app/components/PlayerInput"
import { Scoreboard } from "@/app/components/Scoreboard"
import { Lobby } from "@/app/components/Lobby"
import { GameOver } from "@/app/components/GameOver"
import styles from "./room.module.css"

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const playerName = searchParams.get("name") ?? "Player"

  const socketRef = useRef<PartySocket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedTiles, setSelectedTiles] = useState<number[]>([])
  const [message, setMessage] = useState<{ text: string; kind: "info" | "success" | "error" | "steal" }>({
    text: "Connecting…",
    kind: "info",
  })
  const [myId, setMyId] = useState<string>("")

  // Connect to PartyKit room
  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999"
    const socket = new PartySocket({ host, room: roomId })
    socketRef.current = socket

    socket.addEventListener("open", () => {
      setMyId(socket.id)
      socket.send(JSON.stringify({ type: "join", playerName }))
      setMessage({ text: "Connected — waiting for players…", kind: "info" })
    })

    socket.addEventListener("message", (evt) => {
      const msg: ServerMessage = JSON.parse(evt.data)
      if (msg.type === "state") {
        setGameState(msg.state)
        if (msg.state.phase === "playing") {
          setMessage({ text: "Game started!", kind: "success" })
        }
      } else if (msg.type === "error") {
        setMessage({ text: msg.message, kind: "error" })
      } else if (msg.type === "claimResult") {
        setMessage({ text: msg.message, kind: msg.success ? (msg.message.includes("Stole") ? "steal" : "success") : "error" })
        if (msg.success) setSelectedTiles([])
      }
    })

    socket.addEventListener("close", () => {
      setMessage({ text: "Disconnected. Refresh to reconnect.", kind: "error" })
    })

    return () => socket.close()
  }, [roomId, playerName])

  const send = useCallback((data: object) => {
    socketRef.current?.send(JSON.stringify(data))
  }, [])

  function handleTileClick(id: number) {
    setSelectedTiles(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function handleClaim(playerNameGuess: string) {
    if (selectedTiles.length === 0) {
      setMessage({ text: "Select tiles on the board first.", kind: "error" })
      return
    }
    send({ type: "claim", tileIds: selectedTiles, playerName: playerNameGuess })
  }

  function handlePass() {
    send({ type: "pass" })
    setSelectedTiles([])
  }

  function handleStart(cols: number, rows: number) {
    send({ type: "start", cols, rows })
  }

  if (!gameState) {
    return (
      <div className={styles.loading}>
        <p>Connecting to room <strong>{roomId}</strong>…</p>
      </div>
    )
  }

  const me = gameState.players.find(p => p.id === myId)
  const isMyTurn = gameState.currentTurn === myId
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn)

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.roomCode}>
          Room <span>{roomId}</span>
          <button
            className={styles.copyBtn}
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)}
            title="Copy invite link"
          >
            Copy link
          </button>
        </div>
        <Scoreboard players={gameState.players} currentTurn={gameState.currentTurn} myId={myId} />
      </header>

      <main className={styles.main}>
        {gameState.phase === "lobby" && (
          <Lobby
            players={gameState.players}
            roomId={roomId}
            isHost={gameState.players[0]?.id === myId}
            onStart={handleStart}
          />
        )}

        {gameState.phase === "playing" && (
          <>
            <div className={styles.turnBanner}>
              {isMyTurn
                ? "Your turn"
                : `${currentPlayer?.name ?? "…"}'s turn`}
            </div>

            <Board
              board={gameState.board}
              owners={gameState.owners}
              selectedTiles={selectedTiles}
              onTileClick={isMyTurn ? handleTileClick : () => {}}
              playerCount={gameState.players.length}
            />

            <div className={styles.messageBar} data-kind={message.kind}>
              {message.text}
            </div>

            {isMyTurn && (
              <PlayerInput
                onClaim={handleClaim}
                onPass={handlePass}
                selectedCount={selectedTiles.length}
              />
            )}
          </>
        )}

        {gameState.phase === "finished" && (
          <GameOver players={gameState.players} board={gameState.board} owners={gameState.owners} />
        )}
      </main>
    </div>
  )
}
