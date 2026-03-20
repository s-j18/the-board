"use client"
import { useState, useRef, useEffect } from "react"
import styles from "./PlayerInput.module.css"

interface PlayerResult {
  id: string
  name: string
  nationalities: string[]
  flagEmoji: string | null
  position: string | null
}

// Map nationality name → flag-icons code
const NATIONALITY_TO_CODE: Record<string, string> = {
  "England": "gb-eng", "Scotland": "gb-sct", "Wales": "gb-wls",
  "France": "fr", "Germany": "de", "Spain": "es", "Italy": "it",
  "Portugal": "pt", "Brazil": "br", "Argentina": "ar", "Netherlands": "nl",
  "Belgium": "be", "Croatia": "hr", "Uruguay": "uy", "Colombia": "co",
  "Mexico": "mx", "United States": "us", "Senegal": "sn", "Nigeria": "ng",
  "Ghana": "gh", "Ivory Coast": "ci", "Morocco": "ma", "Egypt": "eg",
  "Cameroon": "cm", "South Korea": "kr", "Japan": "jp", "Australia": "au",
  "Denmark": "dk", "Sweden": "se", "Norway": "no", "Poland": "pl",
  "Czech Republic": "cz", "Austria": "at", "Switzerland": "ch",
  "Serbia": "rs", "Ukraine": "ua", "Turkey": "tr", "Greece": "gr",
  "Russia": "ru", "Hungary": "hu", "Romania": "ro", "Slovakia": "sk",
  "Slovenia": "si", "Albania": "al", "Bosnia-Herzegovina": "ba",
  "Montenegro": "me", "Kosovo": "xk", "North Macedonia": "mk",
  "Chile": "cl", "Peru": "pe", "Ecuador": "ec", "Venezuela": "ve",
  "Paraguay": "py", "Bolivia": "bo", "Jamaica": "jm", "Costa Rica": "cr",
  "Algeria": "dz", "Tunisia": "tn", "Mali": "ml", "Guinea": "gn",
  "DR Congo": "cd", "South Africa": "za", "Saudi Arabia": "sa",
  "Iran": "ir", "Qatar": "qa", "China": "cn", "Finland": "fi",
  "Republic of Ireland": "ie", "Ireland": "ie", "Northern Ireland": "gb",
  "Israel": "il", "Bulgaria": "bg", "Georgia": "ge", "Iceland": "is",
  "Lithuania": "lt", "Latvia": "lv", "Estonia": "ee",
}

export interface SelectedPlayer {
  id: string
  name: string
  nationalities: string[]
}

interface Props {
  onClaim: (playerName: string, selected: SelectedPlayer | null) => void
  onPass: () => void
  selectedCount: number
}

const MIN_TILES = 2

export function PlayerInput({ onClaim, onPass, selectedCount }: Props) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlayerResult[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null)
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
    setSelectedPlayer(null)
  }, [query])

  function handleSelect(result: PlayerResult) {
    setQuery(result.name)
    setSelectedPlayer({ id: result.id, name: result.name, nationalities: result.nationalities })
    setSuggestions([])
    inputRef.current?.focus()
  }

  function handleSubmit() {
    if (!query.trim() || selectedCount < MIN_TILES) return
    onClaim(query.trim(), selectedPlayer)
    setQuery("")
    setSelectedPlayer(null)
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
          className={`${styles.input} ${selectedPlayer ? styles.inputLocked : ""}`}
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
        {selectedPlayer && !loading && (
          <span className={styles.lockedIndicator} title="Player selected">✓</span>
        )}
        {suggestions.length > 0 && (
          <ul className={styles.dropdown}>
            {suggestions.map(result => {
              const flagCode = result.nationalities[0]
                ? NATIONALITY_TO_CODE[result.nationalities[0]] ?? null
                : null
              return (
                <li
                  key={result.id}
                  className={styles.suggestion}
                  onMouseDown={e => { e.preventDefault(); handleSelect(result) }}
                  onTouchEnd={e => { e.preventDefault(); handleSelect(result) }}
                >
                  <span className={styles.suggestionName}>{result.name}</span>
                  <span className={styles.suggestionMeta}>
                    {flagCode && (
                      <span className={`fi fi-${flagCode} ${styles.flag}`} />
                    )}
                    {result.position && (
                      <span className={styles.position}>{result.position}</span>
                    )}
                  </span>
                </li>
              )
            })}
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
