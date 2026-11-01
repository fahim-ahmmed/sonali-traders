import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import Settings from "@/models/Settings";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX = 2 * 1024 * 1024; // 2MB

export async function POST(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const form = await req.formData();
  const file = form.get("logo");
  if (!file || typeof file === "string") return fail("Choose a logo file first", 422);
  if (!TYPES.includes(file.type)) return fail("Logo must be PNG, JPG, WEBP or SVG", 422);
  if (file.size > MAX) return fail("Logo must be 2MB or smaller", 422);

  // ধাপ ১: data URL হিসেবে MongoDB-তে সংরক্ষণ। ডিপ্লয়ের সময় Vercel Blob/Cloudinary-তে সরানো যাবে।
  const buf = Buffer.from(await file.arrayBuffer());
  const logoUrl = `data:${file.type};base64,${buf.toString("base64")}`;
  await connectDB();
  await Settings.findOneAndUpdate({ key: "main" }, { $set: { logoUrl } }, { upsert: true });
  return ok({ logoUrl });
}
