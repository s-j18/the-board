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
  club: string
  age: string
}

interface TmTransfer {
  clubName: string
  date?: string
}

interface TmProfile {
  id: string
  name: string
  nameInHomeCountry?: string
  nationality: string[]
  club?: { id: string; name: string }
}

// Search Transfermarkt for a player by name, return top matches
export async function searchTransfermarkt(query: string): Promise<TmSearchResult[]> {
  const url = `${TM_BASE}/players/search/${encodeURIComponent(query)}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

// Get a player's full career club history from Transfermarkt
export async function getPlayerCareer(tmId: string): Promise<Player | null> {
  try {
    const [profileRes, transfersRes] = await Promise.all([
      fetch(`${TM_BASE}/players/${tmId}/profile`, { next: { revalidate: 86400 } }),
      fetch(`${TM_BASE}/players/${tmId}/transfers`, { next: { revalidate: 86400 } }),
    ])

    if (!profileRes.ok) return null

    const profile: TmProfile = await profileRes.json()
    const transfers: { transferHistory?: TmTransfer[] } = transfersRes.ok
      ? await transfersRes.json()
      : {}

    // Build tag list from career clubs
    const clubTags = new Set<string>()

    // Add current club
    if (profile.club?.name) {
      clubTags.add(normalise(profile.club.name))
      addCompetitionTags(normalise(profile.club.name), clubTags)
    }

    // Add all clubs from transfer history
    for (const t of transfers.transferHistory ?? []) {
      if (t.clubName && t.clubName !== "Without Club" && t.clubName !== "Retired") {
        const norm = normalise(t.clubName)
        clubTags.add(norm)
        addCompetitionTags(norm, clubTags)
      }
    }

    // Add nationality tags
    const nationTags = profile.nationality.map(n => normalise(n))
    // Add "ireland" alias for "republic of ireland"
    if (nationTags.includes("republic of ireland")) nationTags.push("ireland")
    if (nationTags.includes("netherlands")) nationTags.push("holland")
    if (nationTags.includes("czech republic")) nationTags.push("czechia")

    const tags = [...clubTags, ...nationTags]

    return {
      id: tmId,
      name: profile.name,
      searchName: normalise(profile.name),
      tags,
      nationality: nationTags,
    }
  } catch {
    return null
  }
}

// ── Map known clubs to their competition/league tags ─────────────────────────
// This enriches tags so "arsenal" automatically implies "premier league" & "england"

const CLUB_COMPETITION_MAP: Record<string, string[]> = {
  // Premier League clubs → implied tags
  "arsenal": ["premier league", "england"],
  "aston villa": ["premier league", "england"],
  "brentford": ["premier league", "championship", "england"],
  "brighton": ["premier league", "england"],
  "burnley": ["premier league", "championship", "england"],
  "chelsea": ["premier league", "champions league", "england"],
  "crystal palace": ["premier league", "england"],
  "everton": ["premier league", "england"],
  "fulham": ["premier league", "championship", "england"],
  "leeds united": ["premier league", "championship", "england"],
  "leicester city": ["premier league", "championship", "england"],
  "liverpool": ["premier league", "champions league", "england"],
  "manchester city": ["premier league", "champions league", "england"],
  "man city": ["premier league", "champions league", "england"],
  "manchester united": ["premier league", "champions league", "england"],
  "man united": ["premier league", "champions league", "england"],
  "newcastle united": ["premier league", "champions league", "england"],
  "newcastle": ["premier league", "england"],
  "norwich city": ["premier league", "championship", "england"],
  "nottingham forest": ["premier league", "championship", "england"],
  "southampton": ["premier league", "championship", "england"],
  "tottenham hotspur": ["premier league", "champions league", "england"],
  "tottenham": ["premier league", "champions league", "england"],
  "spurs": ["premier league", "champions league", "england"],
  "sunderland": ["premier league", "championship", "england"],
  "watford": ["premier league", "championship", "england"],
  "west bromwich albion": ["premier league", "championship", "england"],
  "west brom": ["premier league", "championship", "england"],
  "west ham united": ["premier league", "england"],
  "west ham": ["premier league", "england"],
  "wolverhampton wanderers": ["premier league", "championship", "england"],
  "wolves": ["premier league", "championship", "england"],
  "blackburn rovers": ["premier league", "championship", "england"],
  "blackburn": ["premier league", "championship", "england"],
  "bolton wanderers": ["premier league", "championship", "england"],
  "bolton": ["premier league", "championship", "england"],
  "derby county": ["championship", "england"],
  "ipswich town": ["premier league", "championship", "england"],
  "middlesbrough": ["premier league", "championship", "england"],
  "portsmouth": ["premier league", "championship", "england"],
  "stoke city": ["premier league", "championship", "england"],
  "swansea city": ["premier league", "championship", "england"],
  "wigan athletic": ["premier league", "championship", "england"],
  // European clubs
  "barcelona": ["la liga", "spain", "champions league"],
  "real madrid": ["la liga", "spain", "champions league"],
  "atletico madrid": ["la liga", "spain", "champions league"],
  "sevilla": ["la liga", "spain", "champions league"],
  "valencia": ["la liga", "spain", "champions league"],
  "bayern munich": ["bundesliga", "germany", "champions league"],
  "borussia dortmund": ["bundesliga", "germany", "champions league"],
  "dortmund": ["bundesliga", "germany", "champions league"],
  "rb leipzig": ["bundesliga", "germany", "champions league"],
  "bayer leverkusen": ["bundesliga", "germany", "champions league"],
  "leverkusen": ["bundesliga", "germany", "champions league"],
  "juventus": ["serie a", "italy", "champions league"],
  "ac milan": ["serie a", "italy", "champions league"],
  "milan": ["serie a", "italy", "champions league"],
  "inter milan": ["serie a", "italy", "champions league"],
  "internazionale": ["serie a", "italy", "champions league"],
  "as roma": ["serie a", "italy", "champions league"],
  "roma": ["serie a", "italy", "champions league"],
  "napoli": ["serie a", "italy", "champions league"],
  "paris saint-germain": ["ligue 1", "france", "champions league"],
  "psg": ["ligue 1", "france", "champions league"],
  "olympique lyonnais": ["ligue 1", "france", "champions league"],
  "lyon": ["ligue 1", "france", "champions league"],
  "as monaco": ["ligue 1", "france", "champions league"],
  "monaco": ["ligue 1", "france", "champions league"],
  "olympique de marseille": ["ligue 1", "france", "champions league"],
  "marseille": ["ligue 1", "france", "champions league"],
  "ajax": ["eredivisie", "netherlands", "champions league"],
  "fc porto": ["portugal", "champions league"],
  "porto": ["portugal", "champions league"],
  "benfica": ["portugal", "champions league"],
  "galatasaray": ["turkey"],
  "fenerbahce": ["turkey"],
  "celtic": ["scotland", "champions league"],
  "rangers": ["scotland"],
  "slavia prague": ["czech republic", "czechia"],
  "anderlecht": ["belgium"],
}

function addCompetitionTags(normClubName: string, tags: Set<string>) {
  const implied = CLUB_COMPETITION_MAP[normClubName]
  if (implied) implied.forEach(t => tags.add(t))
}

// ── Fuse.js search over a local player list ───────────────────────────────────

let fuseInstance: Fuse<Player> | null = null

export function buildFuseIndex(players: Player[]): Fuse<Player> {
  fuseInstance = new Fuse(players, {
    keys: ["name", "searchName"],
    threshold: 0.35,
    includeScore: true,
  })
  return fuseInstance
}

export function searchPlayers(query: string, players: Player[]): Player[] {
  if (!fuseInstance) buildFuseIndex(players)
  const results = fuseInstance!.search(normalise(query))
  return results.map(r => r.item)
}
