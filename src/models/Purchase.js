import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String, // নামের snapshot
    qty: { type: Number, required: true },
    buyPrice: { type: Number, required: true }, // পয়সা
    lineTotal: { type: Number, required: true }, // পয়সা
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    date: { type: Date, required: true },
    stockControl: { type: Boolean, default: true },
    items: { type: [ItemSchema], validate: (v) => v.length > 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
PurchaseSchema.index({ date: -1 });
PurchaseSchema.index({ supplierId: 1 });
export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
