import { NextRequest, NextResponse } from "next/server"
import { generateBoard, TILE_POOL } from "@/lib/board"

export async function GET(req: NextRequest) {
  const cols = Math.min(Math.max(Number(req.nextUrl.searchParams.get("cols") ?? 5), 3), 12)
  const rows = Math.min(Math.max(Number(req.nextUrl.searchParams.get("rows") ?? 5), 3), 12)
  const total = cols * rows

  if (total > TILE_POOL.length) {
    return NextResponse.json(
      { error: `Board too large — max ${TILE_POOL.length} tiles.` },
      { status: 400 }
    )
  }

  const board = generateBoard(cols, rows)
  return NextResponse.json(board)
}
