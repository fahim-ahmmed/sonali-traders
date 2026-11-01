import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
SupplierSchema.index({ name: "text", company: "text" });
export default mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
