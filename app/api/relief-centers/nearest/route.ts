import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { ReliefCenter } from "@/models/relief-center"

export async function POST(req: Request) {
  await getDb()
  const { lat, lng } = await req.json().catch(() => ({}))
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat,lng required" }, { status: 400 })
  }
  const center = await ReliefCenter.findOne({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
      },
    },
  }).lean()
  if (!center) return NextResponse.json({ error: "No relief center found" }, { status: 404 })
  return NextResponse.json({
    center: {
      _id: center._id,
      name: center.name,
      details: center.details,
      lat: center.location.coordinates[1],
      lng: center.location.coordinates[0],
    },
  })
}
