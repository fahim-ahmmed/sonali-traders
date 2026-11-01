// চালানো: npm run seed   (আগে .env.local ভরুন)
import { readFileSync, existsSync } from "node:fs";

// .env.local লোড (dotenv ছাড়া)
for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
process.env.ALLOW_SIGNUP = "true"; // শুধু এই প্রসেসে, Admin তৈরির জন্য

const { auth } = await import("../src/lib/auth.js");
const { nativeDb, mongoClient, connectDB } = await import("../src/lib/db.js");
const { default: Settings } = await import("../src/models/Settings.js");
const { default: Counter } = await import("../src/models/Counter.js");
const { default: Subscription } = await import("../src/models/Subscription.js");
const { default: Category } = await import("../src/models/Category.js");
const { default: Product } = await import("../src/models/Product.js");
const mongoose = (await import("mongoose")).default;

await connectDB();

// 1) Admin
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || "Sonali Trading Admin";
if (!email || !password) throw new Error("SEED_ADMIN_EMAIL ও SEED_ADMIN_PASSWORD সেট করুন");
const users = nativeDb.collection("user");
if (!(await users.findOne({ email }))) {
  await auth.api.signUpEmail({ body: { email, password, name } });
}
await users.updateOne({ email }, { $set: { role: "admin", permissions: "[]", active: true } });
console.log("✔ Admin:", email);

// 2) Settings
await Settings.updateOne({ key: "main" }, { $setOnInsert: { companyName: "Sonali Trading", address: "Mojpur Gate, Kushtia-7000" } }, { upsert: true });
console.log("✔ Settings");

// 3) Counter (INV শুরু ১)
await Counter.updateOne({ key: "invoice" }, { $setOnInsert: { seq: 0 } }, { upsert: true });
console.log("✔ Invoice counter");

// 4) Subscription
await Subscription.updateOne(
  { key: "main" },
  { $setOnInsert: { monthlyFee: 200000, validUntil: new Date("2026-11-10T00:00:00+06:00"), nextPaymentDate: new Date("2026-11-09T00:00:00+06:00"), status: "active" } },
  { upsert: true }
);
console.log("✔ Subscription");

// 5) Category–Brand (ভিডিওতে দৃশ্যমান ৬টি + পণ্যের জন্য প্রয়োজনীয় ৩টি = ৯টি)
const pairs = [
  ["CEMENT", "Aman Cement"], ["CEMENT", "FRESH"], ["CEMENT", "HOLCIM"], ["CEMENT", "DHALAI SPECIAL"], ["CEMENT", "BASHUNDHARA"],
  ["ROD", "GPH ispat"], ["ROD", "RICL (DHAKA)"], ["ROD", "ZSRM (DHAKA)"], ["ROD", "BSRM"],
];
const cats = {};
for (const [category, brand] of pairs) {
  cats[`${category}|${brand}`] = await Category.findOneAndUpdate({ category, brand }, { $setOnInsert: { category, brand } }, { upsert: true, new: true });
}
console.log("✔ Categories:", pairs.length);

// 6) ৮টি প্রোডাক্ট (দাম পয়সায়)
const products = [
  ["Aman Cement", "CEMENT", "Aman Cement", 52000], ["Fresh Cement", "CEMENT", "FRESH", 55000],
  ["Holcim Cement", "CEMENT", "HOLCIM", 60000], ["Dhalai Special Cement", "CEMENT", "DHALAI SPECIAL", 60001],
  ["Bashundhara Cement", "CEMENT", "BASHUNDHARA", 50000],
  ["10mm ROD", "ROD", "BSRM", 9200], ["8mm ROD", "ROD", "BSRM", 9200], ["BSRM ROD", "ROD", "BSRM", 9200],
];
for (const [pname, category, brand, sellPrice] of products) {
  await Product.updateOne(
    { name: pname, brand },
    { $setOnInsert: { name: pname, brand, categoryId: cats[`${category}|${brand}`]._id, sellPrice, buyPrice: 0, stock: 0 } },
    { upsert: true }
  );
}
console.log("✔ Products:", products.length);

await mongoose.disconnect();
await mongoClient.close();
console.log("\nসিড সম্পন্ন। এখন: npm run dev");
