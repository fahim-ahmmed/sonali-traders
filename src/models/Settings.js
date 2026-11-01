import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true }, // singleton
    companyName: { type: String, default: "Sonali Trading" },
    phone: { type: String, default: "" },
    hotline: { type: String, default: "" },
    address: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    staffDefaultPermissions: { type: [String], default: ["pos"] }, // Role Permission পেজ
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
