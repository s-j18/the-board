import { Board, BoardFilters, League, Tile } from "./types"

// ── Master tile pool ──────────────────────────────────────────────────────────
// tmClubId is the Transfermarkt club ID — used for matching, never shown to user

export interface TileTemplate {
  label: string
  type: "club" | "nation"
  tags: string[]
  tmClubId?: string
  league?: League
  flagCode?: string
}

export const CLUB_POOL: TileTemplate[] = [
  // ── Premier League ──────────────────────────────────────────────────────────
  { label: "Arsenal",         type: "club", tags: ["arsenal"],                  tmClubId: "11",   league: "premier_league" },
  { label: "Aston Villa",     type: "club", tags: ["aston villa"],              tmClubId: "405",  league: "premier_league" },
  { label: "Brentford",       type: "club", tags: ["brentford"],                tmClubId: "1148", league: "premier_league" },
  { label: "Brighton",        type: "club", tags: ["brighton"],                 tmClubId: "1237", league: "premier_league" },
  { label: "Burnley",         type: "club", tags: ["burnley"],                  tmClubId: "1132", league: "premier_league" },
  { label: "Chelsea",         type: "club", tags: ["chelsea"],                  tmClubId: "631",  league: "premier_league" },
  { label: "Crystal Palace",  type: "club", tags: ["crystal palace"],           tmClubId: "873",  league: "premier_league" },
  { label: "Everton",         type: "club", tags: ["everton"],                  tmClubId: "29",   league: "premier_league" },
  { label: "Fulham",          type: "club", tags: ["fulham"],                   tmClubId: "931",  league: "premier_league" },
  { label: "Ipswich Town",    type: "club", tags: ["ipswich", "ipswich town"],  tmClubId: "677",  league: "premier_league" },
  { label: "Leeds United",    type: "club", tags: ["leeds", "leeds united"],    tmClubId: "399",  league: "premier_league" },
  { label: "Leicester City",  type: "club", tags: ["leicester"],                tmClubId: "1003", league: "premier_league" },
  { label: "Liverpool",       type: "club", tags: ["liverpool"],                tmClubId: "31",   league: "premier_league" },
  { label: "Man City",        type: "club", tags: ["manchester city", "man city"], tmClubId: "281", league: "premier_league" },
  { label: "Man United",      type: "club", tags: ["manchester united", "man united"], tmClubId: "985", league: "premier_league" },
  { label: "Newcastle",       type: "club", tags: ["newcastle", "newcastle united"], tmClubId: "762", league: "premier_league" },
  { label: "Nottm Forest",    type: "club", tags: ["nottingham forest"],        tmClubId: "703",  league: "premier_league" },
  { label: "Southampton",     type: "club", tags: ["southampton"],              tmClubId: "180",  league: "premier_league" },
  { label: "Spurs",           type: "club", tags: ["tottenham", "spurs", "tottenham hotspur"], tmClubId: "148", league: "premier_league" },
  { label: "West Ham",        type: "club", tags: ["west ham", "west ham united"], tmClubId: "379", league: "premier_league" },
  { label: "Wolves",          type: "club", tags: ["wolves", "wolverhampton"], tmClubId: "543",  league: "premier_league" },

  // ── Championship (past PL clubs) ────────────────────────────────────────────
  { label: "Blackburn",       type: "club", tags: ["blackburn", "blackburn rovers"], tmClubId: "164", league: "championship" },
  { label: "Bolton",          type: "club", tags: ["bolton", "bolton wanderers"], tmClubId: "325", league: "championship" },
  { label: "Derby County",    type: "club", tags: ["derby", "derby county"],    tmClubId: "22",   league: "championship" },
  { label: "Middlesbrough",   type: "club", tags: ["middlesbrough"],            tmClubId: "freshly", league: "championship" },
  { label: "Norwich City",    type: "club", tags: ["norwich", "norwich city"],  tmClubId: "276",  league: "championship" },
  { label: "Portsmouth",      type: "club", tags: ["portsmouth"],               tmClubId: "822",  league: "championship" },
  { label: "Stoke City",      type: "club", tags: ["stoke", "stoke city"],      tmClubId: "512",  league: "championship" },
  { label: "Sunderland",      type: "club", tags: ["sunderland"],               tmClubId: "289",  league: "championship" },
  { label: "Swansea City",    type: "club", tags: ["swansea", "swansea city"],  tmClubId: "2288", league: "championship" },
  { label: "Watford",         type: "club", tags: ["watford"],                  tmClubId: "1010", league: "championship" },
  { label: "West Brom",       type: "club", tags: ["west brom", "west bromwich albion"], tmClubId: "984", league: "championship" },
  { label: "Wigan Athletic",  type: "club", tags: ["wigan", "wigan athletic"],  tmClubId: "1094", league: "championship" },

  // ── La Liga ─────────────────────────────────────────────────────────────────
  { label: "Barcelona",       type: "club", tags: ["barcelona"],                tmClubId: "131",  league: "la_liga" },
  { label: "Real Madrid",     type: "club", tags: ["real madrid"],              tmClubId: "418",  league: "la_liga" },
  { label: "Atlético Madrid", type: "club", tags: ["atletico madrid", "atletico"], tmClubId: "13", league: "la_liga" },
  { label: "Sevilla",         type: "club", tags: ["sevilla"],                  tmClubId: "368",  league: "la_liga" },
  { label: "Valencia",        type: "club", tags: ["valencia"],                 tmClubId: "1049", league: "la_liga" },
  { label: "Villarreal",      type: "club", tags: ["villarreal"],               tmClubId: "1050", league: "la_liga" },

  // ── Bundesliga ───────────────────────────────────────────────────────────────
  { label: "Bayern Munich",   type: "club", tags: ["bayern", "bayern munich"],  tmClubId: "27",   league: "bundesliga" },
  { label: "Dortmund",        type: "club", tags: ["dortmund", "borussia dortmund"], tmClubId: "16", league: "bundesliga" },
  { label: "RB Leipzig",      type: "club", tags: ["rb leipzig", "leipzig"],    tmClubId: "23826", league: "bundesliga" },
  { label: "Leverkusen",      type: "club", tags: ["leverkusen", "bayer leverkusen"], tmClubId: "15", league: "bundesliga" },
  { label: "Schalke",         type: "club", tags: ["schalke", "schalke 04"],    tmClubId: "33",   league: "bundesliga" },

  // ── Serie A ──────────────────────────────────────────────────────────────────
  { label: "Juventus",        type: "club", tags: ["juventus"],                 tmClubId: "506",  league: "serie_a" },
  { label: "AC Milan",        type: "club", tags: ["ac milan", "milan"],        tmClubId: "5",    league: "serie_a" },
  { label: "Inter Milan",     type: "club", tags: ["inter milan", "inter", "internazionale"], tmClubId: "46", league: "serie_a" },
  { label: "Roma",            type: "club", tags: ["roma", "as roma"],          tmClubId: "12",   league: "serie_a" },
  { label: "Napoli",          type: "club", tags: ["napoli"],                   tmClubId: "6195", league: "serie_a" },

  // ── Ligue 1 ──────────────────────────────────────────────────────────────────
  { label: "PSG",             type: "club", tags: ["psg", "paris saint-germain"], tmClubId: "583", league: "ligue_1" },
  { label: "Lyon",            type: "club", tags: ["lyon", "olympique lyonnais"], tmClubId: "1041", league: "ligue_1" },
  { label: "Monaco",          type: "club", tags: ["monaco", "as monaco"],      tmClubId: "162",  league: "ligue_1" },
  { label: "Marseille",       type: "club", tags: ["marseille"],                tmClubId: "244",  league: "ligue_1" },

  // ── Other Europe ─────────────────────────────────────────────────────────────
  { label: "Ajax",            type: "club", tags: ["ajax"],                     tmClubId: "610",  league: "other_europe" },
  { label: "Porto",           type: "club", tags: ["porto", "fc porto"],        tmClubId: "720",  league: "other_europe" },
  { label: "Benfica",         type: "club", tags: ["benfica"],                  tmClubId: "294",  league: "other_europe" },
  { label: "Celtic",          type: "club", tags: ["celtic"],                   tmClubId: "371",  league: "other_europe" },
  { label: "Rangers",         type: "club", tags: ["rangers"],                  tmClubId: "1003", league: "other_europe" },
  { label: "Galatasaray",     type: "club", tags: ["galatasaray"],              tmClubId: "141",  league: "other_europe" },
  { label: "Fenerbahçe",      type: "club", tags: ["fenerbahce"],               tmClubId: "36",   league: "other_europe" },
  { label: "Anderlecht",      type: "club", tags: ["anderlecht"],               tmClubId: "35",   league: "other_europe" },
  { label: "Slavia Prague",   type: "club", tags: ["slavia prague"],            tmClubId: "2278", league: "other_europe" },
]

export const NATION_POOL: TileTemplate[] = [
  { label: "England",     type: "nation", tags: ["england"],                          flagCode: "gb-eng" },
  { label: "France",      type: "nation", tags: ["france"],                           flagCode: "fr" },
  { label: "Germany",     type: "nation", tags: ["germany"],                          flagCode: "de" },
  { label: "Spain",       type: "nation", tags: ["spain"],                            flagCode: "es" },
  { label: "Italy",       type: "nation", tags: ["italy"],                            flagCode: "it" },
  { label: "Netherlands", type: "nation", tags: ["netherlands", "holland"],           flagCode: "nl" },
  { label: "Belgium",     type: "nation", tags: ["belgium"],                          flagCode: "be" },
  { label: "Portugal",    type: "nation", tags: ["portugal"],                         flagCode: "pt" },
  { label: "Brazil",      type: "nation", tags: ["brazil"],                           flagCode: "br" },
  { label: "Argentina",   type: "nation", tags: ["argentina"],                        flagCode: "ar" },
  { label: "Ireland",     type: "nation", tags: ["ireland", "republic of ireland"],   flagCode: "ie" },
  { label: "Scotland",    type: "nation", tags: ["scotland"],                         flagCode: "gb-sct" },
  { label: "Wales",       type: "nation", tags: ["wales"],                            flagCode: "gb-wls" },
  { label: "Denmark",     type: "nation", tags: ["denmark"],                          flagCode: "dk" },
  { label: "Sweden",      type: "nation", tags: ["sweden"],                           flagCode: "se" },
  { label: "Norway",      type: "nation", tags: ["norway"],                           flagCode: "no" },
  { label: "Croatia",     type: "nation", tags: ["croatia"],                          flagCode: "hr" },
  { label: "Serbia",      type: "nation", tags: ["serbia"],                           flagCode: "rs" },
  { label: "Turkey",      type: "nation", tags: ["turkey"],                           flagCode: "tr" },
  { label: "USA",         type: "nation", tags: ["usa", "united states"],             flagCode: "us" },
  { label: "Senegal",     type: "nation", tags: ["senegal"],                          flagCode: "sn" },
  { label: "Ivory Coast", type: "nation", tags: ["ivory coast", "cote d'ivoire"],     flagCode: "ci" },
  { label: "Ghana",       type: "nation", tags: ["ghana"],                            flagCode: "gh" },
  { label: "Nigeria",     type: "nation", tags: ["nigeria"],                          flagCode: "ng" },
  { label: "Cameroon",    type: "nation", tags: ["cameroon"],                         flagCode: "cm" },
]

export const DEFAULT_FILTERS: BoardFilters = {
  englishWeight: 70,
  leagues: ["premier_league", "championship", "la_liga", "bundesliga", "serie_a", "ligue_1", "eredivisie", "other_europe"],
  includeNations: true,
}

const ENGLISH_LEAGUES: League[] = ["premier_league", "championship"]

// ── Shuffle ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Board generator ───────────────────────────────────────────────────────────
export function generateBoard(cols: number, rows: number, filters: BoardFilters = DEFAULT_FILTERS): Board {
  const total = cols * rows

  // Split tile budget
  const nationCount = filters.includeNations ? Math.round(total * 0.2) : 0
  const clubCount = total - nationCount

  // Split clubs into English and European based on weight
  const englishCount = Math.round(clubCount * (filters.englishWeight / 100))
  const europeanCount = clubCount - englishCount

  // Filter available clubs by selected leagues
  const englishClubs = shuffle(
    CLUB_POOL.filter(c => c.league && ENGLISH_LEAGUES.includes(c.league) && filters.leagues.includes(c.league))
  ).slice(0, englishCount)

  const europeanClubs = shuffle(
    CLUB_POOL.filter(c => c.league && !ENGLISH_LEAGUES.includes(c.league) && filters.leagues.includes(c.league))
  ).slice(0, europeanCount)

  const nations = shuffle(NATION_POOL).slice(0, nationCount)

  const combined = shuffle([...englishClubs, ...europeanClubs, ...nations])

  if (combined.length < total) {
    throw new Error(`Not enough tiles for a ${cols}×${rows} board with current filters. Try enabling more leagues or reducing board size.`)
  }

  const tiles: Tile[] = combined.slice(0, total).map((t, i) => ({
    id: i,
    label: t.label,
    type: t.type,
    tags: t.tags,
    tmClubId: t.tmClubId,
    flagCode: t.flagCode,
  }))

  return { tiles, cols, rows }
}
