import { Board as BoardType, TileOwner, Tile } from "@/lib/types"
import styles from "./Board.module.css"
import clsx from "clsx"

const PLAYER_COLORS = ["", "p1", "p2", "p3", "p4"] as const

// Club accent colours by Transfermarkt club ID
const CLUB_ACCENT: Record<string, string> = {
  // Premier League
  "11": "#EF0107",   // Arsenal
  "405": "#95BFE5",  // Aston Villa
  "1148": "#D20000", // Brentford
  "1237": "#0057B8", // Brighton
  "1132": "#6C1D45", // Burnley
  "631": "#034694",  // Chelsea
  "873": "#1B458F",  // Crystal Palace
  "29": "#003399",   // Everton
  "931": "#CC0000",  // Fulham
  "677": "#3D195B",  // Ipswich
  "399": "#FFCD00",  // Leeds
  "1003": "#003090", // Leicester
  "31": "#C8102E",   // Liverpool
  "281": "#6CABDD",  // Man City
  "985": "#DA291C",  // Man United
  "762": "#241F20",  // Newcastle
  "703": "#DD0000",  // Nottm Forest
  "180": "#D71920",  // Southampton
  "148": "#132257",  // Spurs
  "379": "#7A263A",  // West Ham
  "543": "#FDB913",  // Wolves
  // Championship
  "164": "#009EE0",  // Blackburn
  "325": "#263C7E",  // Bolton
  "22": "#000000",   // Derby
  "276": "#FFF200",  // Norwich
  "512": "#E03A3E",  // Stoke
  "289": "#EB172B",  // Sunderland
  "2288": "#121212", // Swansea
  "1010": "#FBEE23", // Watford
  "984": "#122F67",  // West Brom
  // La Liga
  "131": "#A50044",  // Barcelona
  "418": "#FEBE10",  // Real Madrid
  "13": "#CB3524",   // Atlético
  "368": "#D91A21",  // Sevilla
  "1049": "#EE7623", // Valencia
  "1050": "#009640", // Villarreal
  // Bundesliga
  "27": "#DC052D",   // Bayern
  "16": "#FDE100",   // Dortmund
  "23826": "#DD0741",// RB Leipzig
  "15": "#E32221",   // Leverkusen
  "33": "#004D9F",   // Schalke
  // Serie A
  "506": "#000000",  // Juventus
  "5": "#FB090B",    // AC Milan
  "46": "#0068A8",   // Inter
  "12": "#8E1F2F",   // Roma
  "6195": "#12A0C3", // Napoli
  // Ligue 1
  "583": "#004170",  // PSG
  "1041": "#0032A0", // Lyon
  "162": "#D4AF37",  // Monaco
  "244": "#2CBFEF",  // Marseille
}

function getClubInitials(label: string): string {
  const skip = new Set(["FC", "SC", "AC", "AS", "CF", "de", "of", "the", "&"])
  const words = label.split(/[\s\-]+/).filter(w => !skip.has(w) && w.length > 0)
  if (words.length === 0) return label.slice(0, 3).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 3).map(w => w[0]).join("").toUpperCase()
}

// flag-icons uses "gb-eng" style codes — matches our flagCode exactly
function FlagIcon({ code }: { code: string }) {
  // flag-icons expects the region code after "fi-", e.g. fi fi-gb-eng
  return (
    <span
      className={`fi fi-${code}`}
      style={{ borderRadius: 2, width: "1.4em", height: "1em", display: "inline-block" }}
    />
  )
}

interface Props {
  board: BoardType
  owners: TileOwner[]
  selectedTiles: number[]
  onTileClick: (id: number) => void
  locked: boolean
}

export function Board({ board, owners, selectedTiles, onTileClick, locked }: Props) {
  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }}
    >
      {board.tiles.map((tile) => {
        const owner = owners[tile.id]
        const selected = selectedTiles.includes(tile.id)
        const ownerClass = owner > 0 ? PLAYER_COLORS[owner] : null
        const accentColor = tile.type === "club" && tile.tmClubId
          ? (CLUB_ACCENT[tile.tmClubId] ?? "#4B5563")
          : undefined

        return (
          <button
            key={tile.id}
            className={clsx(
              styles.tile,
              tile.type === "club" ? styles.clubTile : styles.nationTile,
              ownerClass && styles[ownerClass],
              selected && styles.selected,
              locked && styles.locked,
            )}
            onClick={() => onTileClick(tile.id)}
            title={tile.label}
            disabled={locked}
          >
            {tile.type === "nation" ? (
              <>
                <span className={styles.tileFlag}>
                  {tile.flagCode
                    ? <FlagIcon code={tile.flagCode} />
                    : "🌍"}
                </span>
                <span className={styles.tileLabel}>{tile.label}</span>
              </>
            ) : (
              <>
                <span
                  className={styles.clubBadge}
                  style={accentColor && !ownerClass
                    ? { background: accentColor } as React.CSSProperties
                    : undefined}
                >
                  {getClubInitials(tile.label)}
                </span>
                <span className={styles.tileLabel}>{tile.label}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
