import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDb()
    
    const { id } = await params
    
    // Find and update the alert status to resolved
    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    )
    
    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Alert resolved successfully",
      alert 
    })
    
  } catch (error) {
    console.error("Error resolving alert:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}