import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Report } from "@/models/report"
import { Alert } from "@/models/alert"
import { Types } from "mongoose"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await getDb()
  const id = params.id
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const { action } = await req.json().catch(() => ({}))
  const report = await Report.findById(id)
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "accept") {
    // Change status to accepted instead of creating alert immediately
    await Report.findByIdAndUpdate(id, { status: "accepted" })
    return NextResponse.json({ ok: true })
  }

  if (action === "resolve") {
    // Create alert and mark as resolved
    await Alert.create({
      type: report.type,
      title: report.details?.slice(0, 80) || `Resolved: ${report.type}`,
      details: report.details || "",
      location: report.location,
      status: "resolved",
      severity: "moderate",
    })
    await Report.findByIdAndUpdate(id, { status: "resolved" })
    return NextResponse.json({ ok: true })
  }

  if (action === "confirm") {
    // Legacy action - keep for backward compatibility
    await Alert.create({
      type: report.type,
      title: report.details?.slice(0, 80) || `Citizen report: ${report.type}`,
      details: report.details || "",
      location: report.location,
      status: "active",
      severity: "moderate",
    })
    await Report.deleteOne({ _id: id })
    return NextResponse.json({ ok: true })
  }

  if (action === "reject") {
    await Report.findByIdAndUpdate(id, { status: "rejected" })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
