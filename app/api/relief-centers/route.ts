import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { ReliefCenter } from "@/models/relief-center"

export async function GET() {
  await getDb()
  const centers = await ReliefCenter.find({}).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ centers })
}

export async function POST(request: NextRequest) {
  try {
    await getDb()
    
    const body = await request.json()
    const { name, details, lat, lng } = body
    
    if (!name || !lat || !lng) {
      return NextResponse.json(
        { error: "Name, latitude and longitude are required" },
        { status: 400 }
      )
    }
    
    const reliefCenter = new ReliefCenter({
      name,
      details: details || '',
      location: {
        type: "Point",
        coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
      }
    })
    
    await reliefCenter.save()
    
    return NextResponse.json(
      { 
        message: "Relief center created successfully",
        center: reliefCenter 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Relief Center Creation Error:", error)
    return NextResponse.json(
      { error: "Failed to create relief center" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getDb()
    
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Relief center ID is required" },
        { status: 400 }
      )
    }
    
    const deletedCenter = await ReliefCenter.findByIdAndDelete(id)
    
    if (!deletedCenter) {
      return NextResponse.json(
        { error: "Relief center not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        message: "Relief center deleted successfully",
        center: deletedCenter 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Relief Center Deletion Error:", error)
    return NextResponse.json(
      { error: "Failed to delete relief center" },
      { status: 500 }
    )
  }
}
