"use client"
import { useState } from "react"
import { GamePlayer, BoardFilters, League, DEFAULT_FILTERS } from "@/lib/types"
import styles from "./Lobby.module.css"

const LEAGUE_OPTIONS: { id: League; label: string }[] = [
  { id: "premier_league", label: "Premier League" },
  { id: "championship",   label: "Championship" },
  { id: "la_liga",        label: "La Liga" },
  { id: "bundesliga",     label: "Bundesliga" },
  { id: "serie_a",        label: "Serie A" },
  { id: "ligue_1",        label: "Ligue 1" },
  { id: "other_europe",   label: "Other European" },
]

interface Props {
  players: GamePlayer[]
  roomId: string
  isHost: boolean
  myId: string
  onStart: (cols: number, rows: number, filters: BoardFilters) => void
  onKick: (playerId: string) => void
}

export function Lobby({ players, roomId, isHost, myId, onStart, onKick }: Props) {
  const [cols, setCols] = useState(5)
  const [rows, setRows] = useState(5)
  const [filters, setFilters] = useState<BoardFilters>({
    ...DEFAULT_FILTERS,
    leagues: ["premier_league", "championship", "la_liga", "bundesliga", "serie_a", "ligue_1", "other_europe"],
  })

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${roomId}?name=`
    : ""

  function toggleLeague(league: League) {
    setFilters(f => ({
      ...f,
      leagues: f.leagues.includes(league)
        ? f.leagues.filter(l => l !== league)
        : [...f.leagues, league],
    }))
  }

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
        <div className={styles.playersHeader}>Players</div>
        {players.map((p, i) => (
          <div key={p.id} className={styles.playerRow}>
            <span className={styles.dot} data-index={p.playerIndex} />
            <span className={styles.playerName}>
              {p.name}
              {p.id === myId && <span className={styles.you}> (you)</span>}
              {i === 0 && <span className={styles.host}> host</span>}
            </span>
            {!p.connected && <span className={styles.away}>disconnected</span>}
            {isHost && p.id !== myId && (
              <button
                className={styles.kickBtn}
                onClick={() => onKick(p.id)}
                title="Remove player"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {players.length < 4 && (
          <div className={styles.playerRow} style={{ opacity: 0.35 }}>
            <span className={styles.dot} />
            <span>Waiting for player…</span>
          </div>
        )}
      </div>

      {isHost && (
        <div className={styles.settings}>
          <h3>Board settings</h3>

          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>Board size</div>
            <div className={styles.sliders}>
              <label>
                <span>Columns: <strong>{cols}</strong></span>
                <input type="range" min={3} max={12} value={cols}
                  onChange={e => setCols(Number(e.target.value))} />
              </label>
              <label>
                <span>Rows: <strong>{rows}</strong></span>
                <input type="range" min={3} max={12} value={rows}
                  onChange={e => setRows(Number(e.target.value))} />
              </label>
            </div>
            <p className={styles.tileCount}>{cols * rows} tiles total</p>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>
              English clubs vs European
            </div>
            <div className={styles.weightRow}>
              <span className={styles.weightLabel}>English {filters.englishWeight}%</span>
              <input
                type="range" min={0} max={100} step={10}
                value={filters.englishWeight}
                onChange={e => setFilters(f => ({ ...f, englishWeight: Number(e.target.value) }))}
              />
              <span className={styles.weightLabel}>European {100 - filters.englishWeight}%</span>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>Leagues in the pool</div>
            <div className={styles.leagues}>
              {LEAGUE_OPTIONS.map(l => (
                <button
                  key={l.id}
                  className={`${styles.leagueBtn} ${filters.leagues.includes(l.id) ? styles.leagueOn : ""}`}
                  onClick={() => toggleLeague(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={filters.includeNations}
                onChange={e => setFilters(f => ({ ...f, includeNations: e.target.checked }))}
              />
              Include nationality tiles
            </label>
          </div>

          <button
            className={styles.startBtn}
            onClick={() => onStart(cols, rows, filters)}
            disabled={players.length < 1 || filters.leagues.length === 0}
          >
            Start game
          </button>
          {filters.leagues.length === 0 && (
            <p className={styles.warning}>Select at least one league</p>
          )}
        </div>
      )}

      {!isHost && (
        <p className={styles.waiting}>Waiting for the host to start the game…</p>
      )}
    </div>
  )
}
