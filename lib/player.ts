import Fuse from "fuse.js"
import { Player } from "./types"

export function normalise(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

const TM_BASE = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"

interface TmSearchResult {
  id: string
  name: string
  nationalities?: string[]
  club?: { id: string; name: string }
  age?: string
}

interface TmTransfer {
  clubFrom?: { id: string; name: string }
  clubTo?: { id: string; name: string }
  date?: string
}

export async function searchTransfermarkt(query: string): Promise<TmSearchResult[]> {
  try {
    const res = await fetch(
      `${TM_BASE}/players/search/${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

export async function getPlayerCareer(tmId: string, searchResult: TmSearchResult): Promise<Player | null> {
  try {
    // Only one API call needed — transfers gives us all clubs
    const transfersRes = await fetch(
      `${TM_BASE}/players/${tmId}/transfers`,
      { next: { revalidate: 86400 } }
    )

    const transfers: { transfers?: TmTransfer[] } = transfersRes.ok
      ? await transfersRes.json()
      : {}

    // Collect all club IDs from transfer history
    const clubIds = new Set<string>()
    const clubNameTags = new Set<string>()

    // Add current club from search result if available
    if (searchResult.club?.id && searchResult.club.name !== "Retired" && searchResult.club.name !== "Without Club") {
      clubIds.add(searchResult.club.id)
      clubNameTags.add(normalise(searchResult.club.name))
    }

    // Add all clubs from transfer history (both clubFrom and clubTo)
    for (const t of transfers.transfers ?? []) {
      const clubs = [t.clubFrom, t.clubTo]
      for (const club of clubs) {
        if (!club) continue
        if (club.name && club.name !== "Without Club" && club.name !== "Retired" && club.name !== "Career break") {
          clubIds.add(club.id)
          clubNameTags.add(normalise(club.name))
        }
      }
    }

    // Get nationality from search result — no profile call needed
    const nationTags = (searchResult.nationalities ?? []).map(n => normalise(n))
    if (nationTags.includes("republic of ireland")) nationTags.push("ireland")
    if (nationTags.includes("netherlands")) nationTags.push("holland")
    if (nationTags.includes("czech republic")) nationTags.push("czechia")
    if (nationTags.includes("ivory coast")) nationTags.push("cote d'ivoire")

    const tags = [...clubNameTags, ...nationTags]

    return {
      id: tmId,
      name: searchResult.name,
      searchName: normalise(searchResult.name),
      clubIds: [...clubIds],
      tags,
      nationality: nationTags,
    }
  } catch {
    return null
  }
}

let fuseInstance: Fuse<{ name: string }> | null = null

export function buildFuseIndex(players: { name: string }[]): void {
  fuseInstance = new Fuse(players, {
    keys: ["name"],
    threshold: 0.35,
    includeScore: true,
  })
}

export function fuzzySearch(query: string, players: { name: string }[]): string[] {
  if (!fuseInstance) buildFuseIndex(players)
  return fuseInstance!.search(normalise(query)).map(r => r.item.name)
}
