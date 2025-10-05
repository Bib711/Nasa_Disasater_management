import { Schema, model, models, Types } from "mongoose"

const GeoPoint = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
)

const ReportSchema = new Schema(
  {
    type: String,
    details: String,
    location: { type: GeoPoint, required: true },
    submittedBy: { type: Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "resolved", "confirmed", "rejected"], default: "pending" },
    priority: { type: String, enum: ["critical", "high", "medium", "low"], default: "medium" },
  },
  { timestamps: true },
)

ReportSchema.index({ location: "2dsphere" })

export const Report = models.Report || model("Report", ReportSchema)
