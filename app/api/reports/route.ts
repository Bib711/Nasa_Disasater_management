import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Report } from "@/models/report"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  await getDb()
  const url = new URL(req.url)
  const status = url.searchParams.get("status") || "pending"
  const reports = await Report.find({ status }).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ reports })
}

export async function POST(req: Request) {
  await getDb()
  const session = await getServerSession(authOptions as any).catch(() => null)
  const body = await req.json().catch(() => ({}))
  const { type, details, location } = body || {}
  if (!type || !location?.coordinates?.length) {
    return NextResponse.json({ error: "Missing type or location" }, { status: 400 })
  }
  const doc = await Report.create({
    type,
    details,
    location, // { type: "Point", coordinates: [lng, lat] }
    submittedBy: session?.user?.id || undefined,
    status: "pending",
  })
  return NextResponse.json({ report: { _id: doc._id } }, { status: 201 })
}
