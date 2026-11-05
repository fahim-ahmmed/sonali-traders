import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] }, // ["cement", "rod"]
    balance: { type: Number, default: 0 }, // পয়সা: + = Due, - = Advance
    manualAvgSale: { type: Number, default: null }, // পয়সা (ঐচ্ছিক ম্যানুয়াল ওভাররাইড)
    manualLastMonthCollection: { type: Number, default: null }, // পয়সা (ঐচ্ছিক ম্যানুয়াল এন্ট্রি)
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ balance: -1 });
CustomerSchema.index({ tags: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);