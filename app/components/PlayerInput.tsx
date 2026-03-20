"use client"
import { useState, useRef, useEffect } from "react"
import styles from "./PlayerInput.module.css"

interface PlayerResult {
  id: string
  name: string
  nationality: string | null
  flagEmoji: string | null
  position: string | null
}

interface Props {
  onClaim: (playerName: string, playerId: string | null) => void
  onPass: () => void
  selectedCount: number
}

const MIN_TILES = 2

export function PlayerInput({ onClaim, onPass, selectedCount }: Props) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlayerResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/player/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.results ?? [])
        }
      } catch {}
      setLoading(false)
    }, 350)
    // Typing clears any previously locked-in selection
    setSelectedId(null)
  }, [query])

  function handleSelect(result: PlayerResult) {
    setQuery(result.name)
    setSelectedId(result.id)
    setSuggestions([])
    inputRef.current?.focus()
  }

  function handleSubmit() {
    if (!query.trim() || selectedCount < MIN_TILES) return
    // Pass the locked-in ID (null if user typed without picking from dropdown)
    onClaim(query.trim(), selectedId)
    setQuery("")
    setSelectedId(null)
    setSuggestions([])
  }

  const notEnoughTiles = selectedCount > 0 && selectedCount < MIN_TILES

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        {selectedCount === 0
          ? `Tap tiles to select them (min ${MIN_TILES}), then enter a player`
          : notEnoughTiles
            ? `Select at least ${MIN_TILES} tiles — ${selectedCount} selected so far`
            : `${selectedCount} tile${selectedCount > 1 ? "s" : ""} selected — enter a player`}
      </p>

      <div className={styles.autocompleteWrap}>
        <input
          ref={inputRef}
          className={`${styles.input} ${selectedId ? styles.inputLocked : ""}`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Type a player name…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
        />
        {loading && <span className={styles.spinner}>…</span>}
        {selectedId && !loading && (
          <span className={styles.lockedIndicator} title="Player selected">✓</span>
        )}
        {suggestions.length > 0 && (
          <ul className={styles.dropdown}>
            {suggestions.map(result => (
              <li
                key={result.id}
                className={styles.suggestion}
                onMouseDown={e => { e.preventDefault(); handleSelect(result) }}
                onTouchEnd={e => { e.preventDefault(); handleSelect(result) }}
              >
                <span className={styles.suggestionName}>{result.name}</span>
                <span className={styles.suggestionMeta}>
                  {result.flagEmoji && (
                    <span className={styles.flag}>{result.flagEmoji}</span>
                  )}
                  {result.position && (
                    <span className={styles.position}>{result.position}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.claimBtn}
          onClick={handleSubmit}
          disabled={!query.trim() || selectedCount < MIN_TILES}
        >
          Claim tiles
        </button>
        <button className={styles.passBtn} onClick={onPass}>
          Pass turn
        </button>
      </div>
    </div>
  )
}
