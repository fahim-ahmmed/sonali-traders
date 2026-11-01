import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  { category: { type: String, required: true, uppercase: true, trim: true }, brand: { type: String, required: true, trim: true } },
  { timestamps: true }
);
CategorySchema.index({ category: 1, brand: 1 }, { unique: true });
export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
