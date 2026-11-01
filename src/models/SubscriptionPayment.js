import mongoose from "mongoose";

const SubscriptionPaymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["bkash", "nagad"], required: true },
    senderNumber: { type: String, required: true, match: /^01\d{9}$/ },
    transactionId: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 1 }, // পয়সা; server-side subscription fee snapshot
    note: { type: String, default: "", maxlength: 300 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", required: true },
    submittedBy: { type: String, required: true },
    submittedByName: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

SubscriptionPaymentSchema.index({ method: 1, transactionId: 1 }, { unique: true });
SubscriptionPaymentSchema.index({ submittedAt: -1 });

export default mongoose.models.SubscriptionPayment || mongoose.model("SubscriptionPayment", SubscriptionPaymentSchema);
