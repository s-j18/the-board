import { Board, Tile } from "./types"

// ── Master tile pool ──────────────────────────────────────────────────────────
// Premier League clubs (past & present) + top European clubs + nations
// Tags are lowercase and used for player matching

export const TILE_POOL: Omit<Tile, "id">[] = [
  // ── Premier League (past & present) ────────────────────────────────────────
  { label: "Arsenal",          type: "club",        tags: ["arsenal", "england", "premier league"] },
  { label: "Aston Villa",      type: "club",        tags: ["aston villa", "england", "premier league"] },
  { label: "Brentford",        type: "club",        tags: ["brentford", "england", "premier league", "championship"] },
  { label: "Brighton",         type: "club",        tags: ["brighton", "england", "premier league"] },
  { label: "Burnley",          type: "club",        tags: ["burnley", "england", "premier league", "championship"] },
  { label: "Chelsea",          type: "club",        tags: ["chelsea", "england", "premier league", "champions league"] },
  { label: "Crystal Palace",   type: "club",        tags: ["crystal palace", "england", "premier league"] },
  { label: "Everton",          type: "club",        tags: ["everton", "england", "premier league"] },
  { label: "Fulham",           type: "club",        tags: ["fulham", "england", "premier league", "championship"] },
  { label: "Leeds United",     type: "club",        tags: ["leeds united", "leeds", "england", "premier league", "championship"] },
  { label: "Leicester City",   type: "club",        tags: ["leicester city", "leicester", "england", "premier league", "championship"] },
  { label: "Liverpool",        type: "club",        tags: ["liverpool", "england", "premier league", "champions league"] },
  { label: "Man City",         type: "club",        tags: ["manchester city", "man city", "england", "premier league", "champions league"] },
  { label: "Man United",       type: "club",        tags: ["manchester united", "man united", "england", "premier league", "champions league"] },
  { label: "Newcastle",        type: "club",        tags: ["newcastle united", "newcastle", "england", "premier league", "champions league"] },
  { label: "Norwich City",     type: "club",        tags: ["norwich city", "norwich", "england", "premier league", "championship"] },
  { label: "Nottm Forest",     type: "club",        tags: ["nottingham forest", "nottm forest", "england", "premier league", "championship"] },
  { label: "Southampton",      type: "club",        tags: ["southampton", "england", "premier league", "championship"] },
  { label: "Spurs",            type: "club",        tags: ["tottenham hotspur", "tottenham", "spurs", "england", "premier league", "champions league"] },
  { label: "Sunderland",       type: "club",        tags: ["sunderland", "england", "championship", "premier league"] },
  { label: "Watford",          type: "club",        tags: ["watford", "england", "premier league", "championship"] },
  { label: "West Brom",        type: "club",        tags: ["west bromwich albion", "west brom", "england", "premier league", "championship"] },
  { label: "West Ham",         type: "club",        tags: ["west ham united", "west ham", "england", "premier league"] },
  { label: "Wolves",           type: "club",        tags: ["wolverhampton wanderers", "wolves", "england", "premier league", "championship"] },
  { label: "Blackburn",        type: "club",        tags: ["blackburn rovers", "blackburn", "england", "premier league", "championship"] },
  { label: "Bolton",           type: "club",        tags: ["bolton wanderers", "bolton", "england", "premier league", "championship"] },
  { label: "Derby County",     type: "club",        tags: ["derby county", "derby", "england", "championship"] },
  { label: "Ipswich Town",     type: "club",        tags: ["ipswich town", "ipswich", "england", "premier league", "championship"] },
  { label: "Middlesbrough",    type: "club",        tags: ["middlesbrough", "england", "premier league", "championship"] },
  { label: "Portsmouth",       type: "club",        tags: ["portsmouth", "england", "premier league", "championship"] },
  { label: "Stoke City",       type: "club",        tags: ["stoke city", "stoke", "england", "premier league", "championship"] },
  { label: "Swansea City",     type: "club",        tags: ["swansea city", "swansea", "england", "premier league", "championship"] },
  { label: "Wigan Athletic",   type: "club",        tags: ["wigan athletic", "wigan", "england", "premier league", "championship"] },

  // ── Top European clubs ──────────────────────────────────────────────────────
  { label: "Barcelona",        type: "club",        tags: ["barcelona", "spain", "la liga", "champions league"] },
  { label: "Real Madrid",      type: "club",        tags: ["real madrid", "spain", "la liga", "champions league"] },
  { label: "Atlético Madrid",  type: "club",        tags: ["atletico madrid", "spain", "la liga", "champions league"] },
  { label: "Sevilla",          type: "club",        tags: ["sevilla", "spain", "la liga", "champions league"] },
  { label: "Valencia",         type: "club",        tags: ["valencia", "spain", "la liga", "champions league"] },
  { label: "Bayern Munich",    type: "club",        tags: ["bayern munich", "germany", "bundesliga", "champions league"] },
  { label: "Dortmund",         type: "club",        tags: ["borussia dortmund", "dortmund", "germany", "bundesliga", "champions league"] },
  { label: "RB Leipzig",       type: "club",        tags: ["rb leipzig", "germany", "bundesliga", "champions league"] },
  { label: "Leverkusen",       type: "club",        tags: ["bayer leverkusen", "leverkusen", "germany", "bundesliga", "champions league"] },
  { label: "Juventus",         type: "club",        tags: ["juventus", "italy", "serie a", "champions league"] },
  { label: "AC Milan",         type: "club",        tags: ["ac milan", "milan", "italy", "serie a", "champions league"] },
  { label: "Inter Milan",      type: "club",        tags: ["inter milan", "internazionale", "italy", "serie a", "champions league"] },
  { label: "Roma",             type: "club",        tags: ["as roma", "roma", "italy", "serie a", "champions league"] },
  { label: "Napoli",           type: "club",        tags: ["napoli", "italy", "serie a", "champions league"] },
  { label: "PSG",              type: "club",        tags: ["paris saint-germain", "psg", "france", "ligue 1", "champions league"] },
  { label: "Lyon",             type: "club",        tags: ["olympique lyonnais", "lyon", "france", "ligue 1", "champions league"] },
  { label: "Monaco",           type: "club",        tags: ["as monaco", "monaco", "france", "ligue 1", "champions league"] },
  { label: "Marseille",        type: "club",        tags: ["olympique de marseille", "marseille", "france", "ligue 1", "champions league"] },
  { label: "Ajax",             type: "club",        tags: ["ajax", "netherlands", "eredivisie", "champions league"] },
  { label: "Porto",            type: "club",        tags: ["fc porto", "porto", "portugal", "champions league"] },
  { label: "Benfica",          type: "club",        tags: ["benfica", "portugal", "champions league"] },
  { label: "Galatasaray",      type: "club",        tags: ["galatasaray", "turkey"] },
  { label: "Fenerbahçe",       type: "club",        tags: ["fenerbahce", "turkey"] },
  { label: "Celtic",           type: "club",        tags: ["celtic", "scotland", "champions league"] },
  { label: "Rangers",          type: "club",        tags: ["rangers", "scotland"] },
  { label: "Slavia Prague",    type: "club",        tags: ["slavia prague", "czech republic", "czechia"] },
  { label: "Anderlecht",       type: "club",        tags: ["anderlecht", "belgium"] },

  // ── Nations ─────────────────────────────────────────────────────────────────
  { label: "England",          type: "nation",      tags: ["england"], flagCode: "gb-eng" },
  { label: "France",           type: "nation",      tags: ["france"], flagCode: "fr" },
  { label: "Germany",          type: "nation",      tags: ["germany"], flagCode: "de" },
  { label: "Spain",            type: "nation",      tags: ["spain"], flagCode: "es" },
  { label: "Italy",            type: "nation",      tags: ["italy"], flagCode: "it" },
  { label: "Netherlands",      type: "nation",      tags: ["netherlands", "holland"], flagCode: "nl" },
  { label: "Belgium",          type: "nation",      tags: ["belgium"], flagCode: "be" },
  { label: "Portugal",         type: "nation",      tags: ["portugal"], flagCode: "pt" },
  { label: "Brazil",           type: "nation",      tags: ["brazil"], flagCode: "br" },
  { label: "Argentina",        type: "nation",      tags: ["argentina"], flagCode: "ar" },
  { label: "Ireland",          type: "nation",      tags: ["ireland", "republic of ireland"], flagCode: "ie" },
  { label: "Scotland",         type: "nation",      tags: ["scotland"], flagCode: "gb-sct" },
  { label: "Wales",            type: "nation",      tags: ["wales"], flagCode: "gb-wls" },
  { label: "Denmark",          type: "nation",      tags: ["denmark"], flagCode: "dk" },
  { label: "Sweden",           type: "nation",      tags: ["sweden"], flagCode: "se" },
  { label: "Norway",           type: "nation",      tags: ["norway"], flagCode: "no" },
  { label: "Croatia",          type: "nation",      tags: ["croatia"], flagCode: "hr" },
  { label: "Serbia",           type: "nation",      tags: ["serbia"], flagCode: "rs" },
  { label: "Turkey",           type: "nation",      tags: ["turkey"], flagCode: "tr" },
  { label: "USA",              type: "nation",      tags: ["usa", "united states"], flagCode: "us" },
  { label: "Senegal",          type: "nation",      tags: ["senegal"], flagCode: "sn" },
  { label: "Ivory Coast",      type: "nation",      tags: ["ivory coast", "cote d'ivoire"], flagCode: "ci" },
  { label: "Ghana",            type: "nation",      tags: ["ghana"], flagCode: "gh" },
  { label: "Nigeria",          type: "nation",      tags: ["nigeria"], flagCode: "ng" },
  { label: "Cameroon",         type: "nation",      tags: ["cameroon"], flagCode: "cm" },

  // ── Competitions ────────────────────────────────────────────────────────────
  { label: "Premier League",   type: "competition", tags: ["premier league", "england"] },
  { label: "Champions League", type: "competition", tags: ["champions league"] },
  { label: "Europa League",    type: "competition", tags: ["europa league"] },
  { label: "La Liga",          type: "competition", tags: ["la liga", "spain"] },
  { label: "Bundesliga",       type: "competition", tags: ["bundesliga", "germany"] },
  { label: "Serie A",          type: "competition", tags: ["serie a", "italy"] },
  { label: "Ligue 1",          type: "competition", tags: ["ligue 1", "france"] },
  { label: "Championship",     type: "competition", tags: ["championship", "england"] },
]

// ── Board generator ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBoard(cols: number, rows: number): Board {
  const total = cols * rows

  if (total > TILE_POOL.length) {
    throw new Error(
      `Board size ${cols}×${rows} = ${total} tiles, but only ${TILE_POOL.length} tile types exist.`
    )
  }

  // Bias the selection: always include some clubs, some nations, maybe competitions
  const clubs = TILE_POOL.filter(t => t.type === "club")
  const nations = TILE_POOL.filter(t => t.type === "nation")
  const competitions = TILE_POOL.filter(t => t.type === "competition")

  // Rough split: 60% clubs, 25% nations, 15% competitions (adjusted to fit total)
  const nCompetitions = Math.max(0, Math.min(Math.floor(total * 0.15), competitions.length))
  const nNations = Math.max(0, Math.min(Math.floor(total * 0.25), nations.length))
  const nClubs = total - nNations - nCompetitions

  const picked = [
    ...shuffle(clubs).slice(0, nClubs),
    ...shuffle(nations).slice(0, nNations),
    ...shuffle(competitions).slice(0, nCompetitions),
  ]

  const shuffled = shuffle(picked)

  const tiles: Tile[] = shuffled.map((t, i) => ({ ...t, id: i }))

  return { tiles, cols, rows }
}
