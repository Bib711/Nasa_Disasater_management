import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { User } from "@/models/user"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, phone, role = "citizen", location } = body || {}
    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    await getDb()
    const exists = await User.findOne({ $or: [{ email }, { phone }] }).lean()
    if (exists) return NextResponse.json({ error: "Email or phone already in use" }, { status: 409 })
    const hash = await bcrypt.hash(password, 10)
    await User.create({
      email,
      password: hash,
      name,
      phone,
      role,
      location: location?.coordinates ? location : undefined,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
