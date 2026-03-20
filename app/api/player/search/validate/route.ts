import { NextRequest, NextResponse } from "next/server"
import { getPlayerCareer, searchTransfermarkt, normalise } from "@/lib/player"

export async function POST(req: NextRequest) {
  try {
    const { playerName, tileIds, board } = await req.json()

    if (!playerName || !tileIds || !board) {
      return NextResponse.json({ valid: false, message: "Missing required fields." }, { status: 400 })
    }

    // Search Transfermarkt for the player
    const results = await searchTransfermarkt(normalise(playerName))

    if (!results.length) {
      return NextResponse.json({ valid: false, message: `"${playerName}" not found.` })
    }

    // Get full career for the top result
    const player = await getPlayerCareer(results[0].id)

    if (!player) {
      return NextResponse.json({ valid: false, message: `Could not load career data for "${playerName}".` })
    }

    // Check each selected tile against the player's career
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

      if (!matches) {
        failedTiles.push(tile.label)
      }
    }

    if (failedTiles.length > 0) {
      return NextResponse.json({
        valid: false,
        message: `${player.name} has no connection to: ${failedTiles.join(", ")}.`,
        playerName: player.name,
      })
    }

    return NextResponse.json({
      valid: true,
      message: `${player.name} is valid!`,
      playerName: player.name,
      clubIds: player.clubIds,
      tags: player.tags,
    })

  } catch (err) {
    console.error("Validate error:", err)
    return NextResponse.json({ valid: false, message: "Server error — please try again." }, { status: 500 })
  }
}
