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
  try {
    await getDb()
    const session = await getServerSession(authOptions as any).catch(() => null)
    const body = await req.json().catch(() => ({}))
    const { type, details, location } = body || {}
    
    // Enhanced validation
    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return NextResponse.json({ error: "Valid incident type is required" }, { status: 400 })
    }
    
    if (!details || typeof details !== 'string' || details.trim().length < 10) {
      return NextResponse.json({ error: "Detailed description is required (minimum 10 characters)" }, { status: 400 })
    }
    
    if (!location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return NextResponse.json({ error: "Valid location coordinates are required" }, { status: 400 })
    }
    
    const [lng, lat] = location.coordinates
    if (typeof lng !== 'number' || typeof lat !== 'number' || 
        Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ error: "Invalid location coordinates" }, { status: 400 })
    }
    
    // Validate incident type
    const validTypes = ['flood', 'fire', 'landslide', 'accident', 'medical', 'earthquake', 'storm', 'other']
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json({ error: "Invalid incident type" }, { status: 400 })
    }
    
    const doc = await Report.create({
      type: type.trim(),
      details: details.trim(),
      location: { 
        type: "Point", 
        coordinates: [lng, lat] 
      },
      submittedBy: (session as any)?.user?.id || undefined,
      status: "pending",
    })
    
    return NextResponse.json({ 
      report: { 
        _id: doc._id,
        type: doc.type,
        status: doc.status,
        createdAt: doc.createdAt
      } 
    }, { status: 201 })
    
  } catch (error) {
    console.error("Report creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create report. Please try again." 
    }, { status: 500 })
  }
}
