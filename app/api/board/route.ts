import { NextRequest, NextResponse } from "next/server"
import { generateBoard, CLUB_POOL, NATION_POOL } from "@/lib/board"
import { DEFAULT_FILTERS } from "@/lib/types"

export async function GET(req: NextRequest) {
  const cols = Math.min(Math.max(Number(req.nextUrl.searchParams.get("cols") ?? 5), 3), 12)
  const rows = Math.min(Math.max(Number(req.nextUrl.searchParams.get("rows") ?? 5), 3), 12)
  const total = cols * rows

  if (total > CLUB_POOL.length + NATION_POOL.length) {
    return NextResponse.json(
      { error: `Board too large for current filters.` },
      { status: 400 }
    )
  }

  const board = generateBoard(cols, rows, DEFAULT_FILTERS)
  return NextResponse.json(board)
}