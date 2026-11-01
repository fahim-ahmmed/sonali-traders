import mongoose from "mongoose";

const LedgerEntrySchema = new mongoose.Schema(
  {
    partyType: { type: String, enum: ["customer", "supplier"], default: "customer" },
    partyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["sale", "payment", "opening_due", "advance"], required: true },
    debit: { type: Number, default: 0 },  // পয়সা — বাকি বাড়ায়
    credit: { type: Number, default: 0 }, // পয়সা — বাকি কমায়
    description: { type: String, default: "" },
    qty: { type: String, default: "" }, // প্রদর্শনের জন্য (যেমন "200 pcs")
    note: { type: String, default: "" },
    refId: { type: mongoose.Schema.Types.ObjectId },
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);
LedgerEntrySchema.index({ partyId: 1, date: 1 });
export default mongoose.models.LedgerEntry || mongoose.model("LedgerEntry", LedgerEntrySchema);
