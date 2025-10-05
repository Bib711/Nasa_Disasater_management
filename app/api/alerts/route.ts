import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"

export async function GET(req: Request) {
  await getDb()
  
  const url = new URL(req.url)
  const lat = parseFloat(url.searchParams.get("lat") || "0")
  const lng = parseFloat(url.searchParams.get("lng") || "0")
  const radius = parseFloat(url.searchParams.get("radius") || "150") // Default 150km radius
  
  let alerts
  
  if (lat && lng) {
    // Find alerts within the specified radius (in kilometers)
    alerts = await Alert.find({
      status: "active",
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius / 6378.1] // radius in radians (radius_km / 6378.1)
        }
      }
    }).sort({ createdAt: -1 }).limit(50).lean()
  } else {
    // Fallback: get all active alerts
    alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(50).lean()
  }
  
  return NextResponse.json({ alerts })
}

export async function POST(req: Request) {
  await getDb()
  
  const body = await req.json().catch(() => ({}))
  const { type, title, details, location, severity } = body || {}
  
  if (!type || !title || !location?.coordinates?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  
  const alert = await Alert.create({
    type,
    title,
    details,
    location, // { type: "Point", coordinates: [lng, lat] }
    severity: severity || "moderate",
    status: "active"
  })
  
  return NextResponse.json({ alert: { _id: alert._id } }, { status: 201 })
}
