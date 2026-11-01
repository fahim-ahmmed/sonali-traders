import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    tags: { type: [String], default: [] }, // "cement" | "rod"
    balance: { type: Number, default: 0 }, // পয়সা; ledger-এর যোগফলের ক্যাশ। + = Due, − = Advance
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
CustomerSchema.index({ name: "text", phone: "text", address: "text" });
CustomerSchema.index({ balance: -1 });
CustomerSchema.index({ phone: 1 });
export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
