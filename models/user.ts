import { Schema, model, models } from "mongoose"

const GeoPoint = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
)

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    location: { type: GeoPoint, required: false },
    role: { type: String, enum: ["citizen", "rescue_worker"], required: true },
  },
  { timestamps: true },
)

UserSchema.index({ location: "2dsphere" })

export type UserRole = "citizen" | "rescue_worker"
export type UserDoc = {
  _id: string
  email: string
  name: string
  phone: string
  role: UserRole
  location?: { type: "Point"; coordinates: [number, number] }
}

export const User = models.User || model("User", UserSchema)
