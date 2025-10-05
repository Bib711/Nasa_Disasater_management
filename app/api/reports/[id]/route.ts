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

  if (action === "confirm") {
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
    await Report.deleteOne({ _id: id })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
