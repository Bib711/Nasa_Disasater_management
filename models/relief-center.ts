import { Schema, model, models } from "mongoose"

const GeoPoint = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
)

const ReliefCenterSchema = new Schema(
  {
    name: String,
    details: String,
    location: { type: GeoPoint, required: true },
  },
  { timestamps: true },
)

ReliefCenterSchema.index({ location: "2dsphere" })

export const ReliefCenter = models.ReliefCenter || model("ReliefCenter", ReliefCenterSchema)
