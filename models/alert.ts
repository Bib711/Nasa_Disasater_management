import { Schema, model, models, Types } from "mongoose"

const GeoPoint = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
)

const AlertSchema = new Schema(
  {
    type: String,
    title: String,
    details: String,
    location: { type: GeoPoint, required: true },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
    severity: { type: String, enum: ["high", "moderate", "low"] },
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

AlertSchema.index({ location: "2dsphere" })

export const Alert = models.Alert || model("Alert", AlertSchema)
