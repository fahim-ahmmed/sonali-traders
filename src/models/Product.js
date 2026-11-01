import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true },
    buyPrice: { type: Number, default: null },  // পয়সা
    sellPrice: { type: Number, required: true }, // পয়সা
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
ProductSchema.index({ name: "text" });
ProductSchema.index({ categoryId: 1, brand: 1 });
ProductSchema.index({ name: 1, categoryId: 1, brand: 1 }, { unique: true });
export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
