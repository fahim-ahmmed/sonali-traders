import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // Better Auth user id
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: "" },
    phone: { type: String, default: "" },
    salary: { type: Number, default: 0 }, // পয়সা
    address: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
