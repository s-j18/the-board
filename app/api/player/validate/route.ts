import { NextRequest, NextResponse } from "next/server"
import { getPlayerCareer, searchTransfermarkt, normalise } from "@/lib/player"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const { playerName, playerId, playerNationalities, tileIds, board } = await req.json()

    if (!playerName || !tileIds || !board) {
      return NextResponse.json(
        { valid: false, message: "Missing required fields." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (!Array.isArray(tileIds) || tileIds.length < 2) {
      return NextResponse.json(
        { valid: false, message: "You must select at least 2 tiles." },
        { headers: CORS_HEADERS }
      )
    }

    let player = null

    if (playerId) {
      // We already have id + nationalities from the search result —
      // just fetch transfers to get club history, no profile call needed
      const searchResult = {
        id: playerId,
        name: playerName,
        nationalities: playerNationalities ?? [],
      }
      player = await getPlayerCareer(playerId, searchResult)
    }

    // Fallback: user typed without picking from dropdown — search by name
    if (!player) {
      const results = await searchTransfermarkt(normalise(playerName))
      if (!results.length) {
        return NextResponse.json(
          { valid: false, message: `"${playerName}" not found.` },
          { headers: CORS_HEADERS }
        )
      }
      const topResult = results[0]
      player = await getPlayerCareer(topResult.id, topResult)
    }

    if (!player) {
      return NextResponse.json(
        { valid: false, message: `Could not load career data for "${playerName}".` },
        { headers: CORS_HEADERS }
      )
    }

    // Check each selected tile
    const tiles = board.tiles
    const failedTiles: string[] = []

    for (const id of tileIds) {
      const tile = tiles[id]
      if (!tile) continue

      let matches = false
      if (tile.type === "club" && tile.tmClubId) {
        matches = player.clubIds.includes(tile.tmClubId)
      } else {
        matches = player.tags.some((t: string) => tile.tags.includes(t))
      }

      if (!matches) failedTiles.push(tile.label)
    }

    if (failedTiles.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          message: `${player.name} has no connection to: ${failedTiles.join(", ")}.`,
          playerName: player.name,
        },
        { headers: CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        message: `${player.name} is valid!`,
        playerName: player.name,
        clubIds: player.clubIds,
        tags: player.tags,
      },
      { headers: CORS_HEADERS }
    )

  } catch (err) {
    console.error("Validate error:", err)
    return NextResponse.json(
      { valid: false, message: "Server error — please try again." },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
