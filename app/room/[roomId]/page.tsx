"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import PartySocket from "partysocket"
import { GameState, ServerMessage, BoardFilters } from "@/lib/types"
import { Board } from "@/app/components/Board"
import { PlayerInput } from "@/app/components/PlayerInput"
import { Scoreboard } from "@/app/components/Scoreboard"
import { Lobby } from "@/app/components/Lobby"
import { GameOver } from "@/app/components/GameOver"
import styles from "./room.module.css"

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  const key = "the-board-session"
  let id = localStorage.getItem(key)
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, id)
  }
  return id
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const playerName = searchParams.get("name") ?? "Player"

  const socketRef = useRef<PartySocket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedTiles, setSelectedTiles] = useState<number[]>([])
  const [message, setMessage] = useState<{ text: string; kind: "info" | "success" | "error" | "steal" }>({
    text: "Connecting…", kind: "info",
  })
  const [myId, setMyId] = useState<string>("")
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const sessionId = getSessionId()
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999"
    const socket = new PartySocket({ host, room: roomId })
    socketRef.current = socket

    socket.addEventListener("open", () => {
      setMyId(socket.id)
      socket.send(JSON.stringify({ type: "join", playerName, sessionId }))
      setMessage({ text: "Connected — waiting for players…", kind: "info" })
    })

    socket.addEventListener("message", (evt) => {
      const msg: ServerMessage = JSON.parse(evt.data)
      if (msg.type === "state") {
        setGameState(prev => {
          if (prev?.phase === "finished" && msg.state.phase === "lobby") {
            setSelectedTiles([])
          }
          return msg.state
        })
        if (msg.state.phase === "playing") {
          setMessage({ text: "Select tiles then enter a player.", kind: "info" })
        }
      } else if (msg.type === "error") {
        setMessage({ text: msg.message, kind: "error" })
      } else if (msg.type === "claimResult") {
        const kind = msg.success
          ? msg.message.includes("Stole") ? "steal" : "success"
          : "error"
        setMessage({ text: msg.message, kind })
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

  async function handleClaim(guess: string, selected: { id: string; name: string; nationalities: string[] } | null) {
    if (selectedTiles.length === 0) {
      setMessage({ text: "Select tiles on the board first.", kind: "error" })
      return
    }
    if (!gameState) return

    setValidating(true)
    setMessage({ text: "Checking player…", kind: "info" })

    try {
      // Validate in the browser via Vercel API
      const res = await fetch("/api/player/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: guess,
          playerId: selected?.id ?? null,
          playerNationalities: selected?.nationalities ?? [],
          tileIds: selectedTiles,
          board: gameState.board,
        }),
      })

      const result = await res.json()

      if (!result.valid) {
        // Tell PartyKit the guess was wrong — it advances the turn
        send({
          type: "claim_invalid",
          message: result.message,
        })
        setMessage({ text: result.message, kind: "error" })
      } else {
        // Tell PartyKit the guess was valid — send player data so it can apply scoring
        send({
          type: "claim_valid",
          tileIds: selectedTiles,
          playerName: result.playerName,
          clubIds: result.clubIds,
          tags: result.tags,
        })
      }
    } catch {
      setMessage({ text: "Could not reach server. Try again.", kind: "error" })
    } finally {
      setValidating(false)
    }
  }

  function handlePass() {
    send({ type: "pass" })
    setSelectedTiles([])
  }

  function handleStart(cols: number, rows: number, filters: BoardFilters) {
    send({ type: "start", cols, rows, filters })
  }

  function handleKick(playerId: string) {
    send({ type: "kick", playerId })
  }

  function handleRestart() {
    send({ type: "restart" })
    setSelectedTiles([])
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
  const isLockedOut = me?.lockedOut ?? false
  const isHost = gameState.players[0]?.id === myId
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn)
  const canInteract = isMyTurn && !isLockedOut && !validating

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.roomCode}>
          <span className={styles.roomLabel}>Room</span>
          <span className={styles.roomId}>{roomId}</span>
          <button
            className={styles.copyBtn}
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)}
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
            isHost={isHost}
            myId={myId}
            onStart={handleStart}
            onKick={handleKick}
          />
        )}

        {gameState.phase === "playing" && (
          <>
            <div className={`${styles.turnBanner} ${isMyTurn ? styles.myTurn : ""}`}>
              {validating
                ? "Checking player…"
                : isLockedOut
                  ? "Wrong answer — wait for next turn"
                  : isMyTurn
                    ? "Your turn"
                    : `${currentPlayer?.name ?? "…"}'s turn`}
            </div>

            <Board
              board={gameState.board}
              owners={gameState.owners}
              selectedTiles={selectedTiles}
              onTileClick={canInteract ? handleTileClick : () => {}}
              locked={!canInteract}
            />

            <div className={styles.messageBar} data-kind={message.kind}>
              {message.text}
            </div>

            {canInteract && (
              <PlayerInput
                onClaim={handleClaim}
                onPass={handlePass}
                selectedCount={selectedTiles.length}
              />
            )}

            {!canInteract && gameState.phase === "playing" && (
              <div className={styles.watchingBanner}>
                {validating
                  ? "Validating…"
                  : isLockedOut
                    ? `Locked out — ${currentPlayer?.name ?? "next player"} is now playing`
                    : `Watching ${currentPlayer?.name ?? "…"} play`}
              </div>
            )}
          </>
        )}

        {gameState.phase === "finished" && (
          <GameOver
            players={gameState.players}
            board={gameState.board}
            owners={gameState.owners}
            isHost={isHost}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}
