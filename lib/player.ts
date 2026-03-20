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

// Fetch a player directly by their TM ID — used when we already know the ID from search
export async function getPlayerById(tmId: string): Promise<Player | null> {
  try {
    // Fetch profile and transfers in parallel
    const [profileRes, transfersRes] = await Promise.all([
      fetch(`${TM_BASE}/players/${tmId}/profile`, { next: { revalidate: 86400 } }),
      fetch(`${TM_BASE}/players/${tmId}/transfers`, { next: { revalidate: 86400 } }),
    ])

    const profile = profileRes.ok ? await profileRes.json() : null
    const transferData = transfersRes.ok ? await transfersRes.json() : {}

    const name: string = profile?.name ?? profile?.playerName ?? `Player ${tmId}`
    const nationalities: string[] = profile?.nationalities ?? profile?.nationality ? [profile.nationality] : []

    const clubIds = new Set<string>()
    const clubNameTags = new Set<string>()

    // Current club from profile
    const currentClub = profile?.club ?? profile?.currentClub
    if (currentClub?.id && currentClub?.name &&
        currentClub.name !== "Retired" && currentClub.name !== "Without Club") {
      clubIds.add(String(currentClub.id))
      clubNameTags.add(normalise(currentClub.name))
    }

    // All clubs from transfer history
    for (const t of transferData.transfers ?? []) {
      for (const club of [t.clubFrom, t.clubTo]) {
        if (!club?.name || ["Without Club", "Retired", "Career break"].includes(club.name)) continue
        clubIds.add(String(club.id))
        clubNameTags.add(normalise(club.name))
      }
    }

    const nationTags = nationalities.map((n: string) => normalise(n))
    if (nationTags.includes("republic of ireland")) nationTags.push("ireland")
    if (nationTags.includes("netherlands")) nationTags.push("holland")
    if (nationTags.includes("czech republic")) nationTags.push("czechia")
    if (nationTags.includes("ivory coast")) nationTags.push("cote d'ivoire")

    return {
      id: tmId,
      name,
      searchName: normalise(name),
      clubIds: [...clubIds],
      tags: [...clubNameTags, ...nationTags],
      nationality: nationTags,
    }
  } catch {
    return null
  }
}
