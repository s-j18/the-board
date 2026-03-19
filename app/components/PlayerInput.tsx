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
  }

  function handleSubmit() {
    if (!query.trim()) return
    onClaim(query.trim())
    setQuery("")
    setSuggestions([])
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.hint}>
        {selectedCount === 0
          ? "Select tiles above, then enter a player"
          : `${selectedCount} tile(s) selected — enter a player`}
      </div>

      <div className={styles.inputRow}>
        <div className={styles.autocompleteWrap}>
          <input
            className={styles.input}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Type a player name…"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className={styles.dropdown}>
              {suggestions.map(name => (
                <li
                  key={name}
                  className={styles.suggestion}
                  onMouseDown={() => handleSelect(name)}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {loading && <span className={styles.spinner}>…</span>}
        </div>

        <button
          className={styles.claimBtn}
          onClick={handleSubmit}
          disabled={!query.trim() || selectedCount === 0}
        >
          Claim
        </button>

        <button className={styles.passBtn} onClick={onPass}>
          Pass
        </button>
      </div>
    </div>
  )
}
