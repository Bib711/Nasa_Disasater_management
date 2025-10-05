import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { message, targetGroup } = await req.json()
  if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 })
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!sid || !token || !from) {
    return NextResponse.json({ error: "Twilio env vars missing" }, { status: 501 })
  }

  return NextResponse.json({ ok: true, queued: 0, note: "SMS sending disabled in preview" })
}
