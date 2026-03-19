import Fuse from "fuse.js"
import { Player } from "./types"

// ── Text normalisation ────────────────────────────────────────────────────────
export function normalise(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

// ── Transfermarkt API client ──────────────────────────────────────────────────
const TM_BASE = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api.fly.dev"

interface TmSearchResult {
  id: string
  name: string
  club?: { id: string; name: string }
  age?: string
}

interface TmTransfer {
  clubFrom?: { id: string; name: string }
  clubTo?: { id: string; name: string }
  date?: string
}

interface TmProfile {
  id: string
  name: string
  nationality: string[]
  club?: { id: string; name: string }
}

// Search Transfermarkt for players matching a query
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

// Get a player's full career from Transfermarkt, returning club IDs and name tags
export async function getPlayerCareer(tmId: string): Promise<Player | null> {
  try {
    const [profileRes, transfersRes] = await Promise.all([
      fetch(`${TM_BASE}/players/${tmId}/profile`, { next: { revalidate: 86400 } }),
      fetch(`${TM_BASE}/players/${tmId}/transfers`, { next: { revalidate: 86400 } }),
    ])

    if (!profileRes.ok) return null

    const profile: TmProfile = await profileRes.json()
    const transfers: { transfers?: TmTransfer[] } = transfersRes.ok
      ? await transfersRes.json()
      : {}

    // ── Collect all club IDs from career ──────────────────────────────────────
    // We use IDs (not names) so "Derby" and "Derby County" always match correctly
    const clubIds = new Set<string>()
    const clubNameTags = new Set<string>()

    // Current club from profile
    if (profile.club?.id) {
      clubIds.add(profile.club.id)
      clubNameTags.add(normalise(profile.club.name))
    }

    // All clubs from transfer history
    for (const t of transfers.transfers ?? []) {
      const clubs = [t.clubFrom, t.clubTo]
      for (const club of clubs) {
        if (!club) continue
        const name = club.name
        if (name && name !== "Without Club" && name !== "Retired" && name !== "Career break") {
          clubIds.add(club.id)
          clubNameTags.add(normalise(name))
        }
      }
    }

    // ── Nationality tags ──────────────────────────────────────────────────────
    const nationTags = profile.nationality.map(n => normalise(n))
    // Common aliases
    if (nationTags.includes("republic of ireland")) nationTags.push("ireland")
    if (nationTags.includes("netherlands")) nationTags.push("holland")
    if (nationTags.includes("czech republic")) nationTags.push("czechia")
    if (nationTags.includes("ivory coast")) nationTags.push("cote d'ivoire")

    return {
      id: tmId,
      name: profile.name,
      searchName: normalise(profile.name),
      clubIds: [...clubIds],
      tags: [...clubNameTags, ...nationTags],
      nationality: nationTags,
    }
  } catch {
    return null
  }
}

// ── Fuse.js fuzzy search ──────────────────────────────────────────────────────
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
