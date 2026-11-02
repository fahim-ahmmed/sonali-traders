import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true }, // পয়সা
    purpose: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    paidByType: { type: String, enum: ["staff", "admin"], required: true },
    paidById: { type: String, required: true },
    paidByName: { type: String, default: "" },
    createdBy: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ paidById: 1 });
export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
