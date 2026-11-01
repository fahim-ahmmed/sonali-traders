import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    monthlyFee: { type: Number, default: 200000 }, // ৳2,000 (পয়সা)
    validUntil: Date,
    nextPaymentDate: Date,
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
