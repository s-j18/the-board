"use client"
import { useState, useRef, useEffect } from "react"
import styles from "./PlayerInput.module.css"

interface Props {
  onClaim: (playerName: string) => void
  onPass: () => void
  selectedCount: number
}

export function PlayerInput({ onClaim, onPass, selectedCount }: Props) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
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
  }, [query])

  function handleSelect(name: string) {
    setQuery(name)
    setSuggestions([])
    inputRef.current?.focus()
  }

  function handleSubmit() {
    if (!query.trim() || selectedCount === 0) return
    onClaim(query.trim())
    setQuery("")
    setSuggestions([])
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        {selectedCount === 0
          ? "Tap tiles above to select them, then enter a player"
          : `${selectedCount} tile${selectedCount > 1 ? "s" : ""} selected — enter a player`}
      </p>

      <div className={styles.autocompleteWrap}>
        <input
          ref={inputRef}
          className={styles.input}
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
        {suggestions.length > 0 && (
          <ul className={styles.dropdown}>
            {suggestions.map(name => (
              <li
                key={name}
                className={styles.suggestion}
                onMouseDown={e => { e.preventDefault(); handleSelect(name) }}
                onTouchEnd={e => { e.preventDefault(); handleSelect(name) }}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.claimBtn}
          onClick={handleSubmit}
          disabled={!query.trim() || selectedCount === 0}
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
