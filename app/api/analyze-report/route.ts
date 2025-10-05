import { NextResponse } from "next/server"
import { classifyPriority } from "@/lib/hf"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 })
    const result = await classifyPriority(text)
    return NextResponse.json({ priority: result.label, score: result.score })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
