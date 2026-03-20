import { NextRequest, NextResponse } from "next/server"
import { normalise } from "@/lib/player"

const TM_BASE = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"

export interface PlayerSearchResult {
  id: string
  name: string
  nationality: string | null
  flagEmoji: string | null
  position: string | null
}

const FLAG_MAP: Record<string, string> = {
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "France": "🇫🇷", "Germany": "🇩🇪", "Spain": "🇪🇸", "Italy": "🇮🇹",
  "Portugal": "🇵🇹", "Brazil": "🇧🇷", "Argentina": "🇦🇷", "Netherlands": "🇳🇱",
  "Belgium": "🇧🇪", "Croatia": "🇭🇷", "Uruguay": "🇺🇾", "Colombia": "🇨🇴",
  "Mexico": "🇲🇽", "United States": "🇺🇸", "Senegal": "🇸🇳", "Nigeria": "🇳🇬",
  "Ghana": "🇬🇭", "Ivory Coast": "🇨🇮", "Morocco": "🇲🇦", "Egypt": "🇪🇬",
  "Cameroon": "🇨🇲", "South Korea": "🇰🇷", "Japan": "🇯🇵", "Australia": "🇦🇺",
  "Denmark": "🇩🇰", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Poland": "🇵🇱",
  "Czech Republic": "🇨🇿", "Austria": "🇦🇹", "Switzerland": "🇨🇭",
  "Serbia": "🇷🇸", "Ukraine": "🇺🇦", "Turkey": "🇹🇷", "Greece": "🇬🇷",
  "Russia": "🇷🇺", "Hungary": "🇭🇺", "Romania": "🇷🇴", "Slovakia": "🇸🇰",
  "Slovenia": "🇸🇮", "Albania": "🇦🇱", "North Macedonia": "🇲🇰",
  "Bosnia-Herzegovina": "🇧🇦", "Montenegro": "🇲🇪", "Kosovo": "🇽🇰",
  "Chile": "🇨🇱", "Peru": "🇵🇪", "Ecuador": "🇪🇨", "Venezuela": "🇻🇪",
  "Paraguay": "🇵🇾", "Bolivia": "🇧🇴", "Jamaica": "🇯🇲", "Costa Rica": "🇨🇷",
  "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Mali": "🇲🇱", "Guinea": "🇬🇳",
  "DR Congo": "🇨🇩", "South Africa": "🇿🇦", "Saudi Arabia": "🇸🇦",
  "Iran": "🇮🇷", "Qatar": "🇶🇦", "China": "🇨🇳", "Finland": "🇫🇮",
  "Republic of Ireland": "🇮🇪", "Ireland": "🇮🇪", "Northern Ireland": "🇬🇧",
  "Israel": "🇮🇱", "Bulgaria": "🇧🇬", "Georgia": "🇬🇪", "Iceland": "🇮🇸",
  "Lithuania": "🇱🇹", "Latvia": "🇱🇻", "Estonia": "🇪🇪",
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const res = await fetch(
      `${TM_BASE}/players/search/${encodeURIComponent(normalise(q))}`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await res.json()
    const results: PlayerSearchResult[] = (data.results ?? [])
      .slice(0, 8)
      .map((r: { id: string; name: string; nationality?: string; position?: string }) => {
        const nationality = r.nationality ?? null
        return {
          id: r.id,
          name: r.name,
          nationality,
          flagEmoji: nationality ? (FLAG_MAP[nationality] ?? null) : null,
          position: r.position ?? null,
        }
      })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
