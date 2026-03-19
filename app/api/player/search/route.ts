import { NextRequest, NextResponse } from "next/server"
import { normalise } from "@/lib/player"

const TM_BASE = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"

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
    // Return just the display names for autocomplete
    const results: string[] = (data.results ?? [])
      .slice(0, 8)
      .map((r: { name: string }) => r.name)

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
