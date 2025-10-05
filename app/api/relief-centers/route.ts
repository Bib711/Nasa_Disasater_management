import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { ReliefCenter } from "@/models/relief-center"

export async function GET() {
  await getDb()
  const centers = await ReliefCenter.find({}).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ centers })
}
