import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"

export async function GET() {
  await getDb()
  const alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(50).lean()
  return NextResponse.json({ alerts })
}
