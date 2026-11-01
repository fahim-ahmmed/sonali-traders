import mongoose from "mongoose";

// Purchase (+), approved Sale (−), adjust (±) — Product Ledger এর উৎস
const StockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["purchase", "sale", "adjust"], required: true },
    qty: { type: Number, required: true }, // + বা −
    refId: { type: mongoose.Schema.Types.ObjectId },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);
StockMovementSchema.index({ productId: 1, date: 1 });
export default mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
