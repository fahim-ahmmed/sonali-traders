// ক্লায়েন্টের পুরনো সিস্টেম থেকে কাস্টমার ও Opening Due ইমপোর্ট
//
//   ড্রাই-রান (কিছু লেখে না):  npm run import:customers -- data/customers.csv --date=2026-10-27 --expect=30405224
//   আসল ইমপোর্ট:               npm run import:customers -- data/customers.csv --date=2026-10-27 --expect=30405224 --commit
//
// CSV হেডার: name,phone,address,due   (due টাকায়; ঋণাত্মক = অ্যাডভান্স)
import { readFileSync, existsSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const commit = args.includes("--commit");
const dateKey = opt("date") || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
const expect = opt("expect") ? Number(opt("expect")) : null;
if (!file || !existsSync(file)) { console.error("CSV ফাইলের পাথ দিন। যেমন: npm run import:customers -- data/customers.csv"); process.exit(1); }

function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((c) => c.trim())) rows.push(row); row = []; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); if (row.some((c) => c.trim())) rows.push(row); }
  return rows;
}

const ROD = /\b(bsrm|gph|ricl|zsrm|ispat|rod)\b/i;
const CEMENT = /(cement|holcim|fresh|aman|dhalai|bashundhara|block)/i;
function tagsFrom(name) {
  const tags = [];
  const inside = (name.match(/\(([^)]*)\)/g) || []).join(" ") || name; // নামের বন্ধনীর ব্র্যান্ড থেকে
  if (CEMENT.test(inside)) tags.push("cement");
  if (ROD.test(inside)) tags.push("rod");
  return tags;
}

const [head, ...body] = parseCSV(readFileSync(file, "utf8"));
const idx = Object.fromEntries(head.map((h, i) => [h.trim().toLowerCase(), i]));
if (idx.name === undefined || idx.due === undefined) { console.error("CSV-তে অন্তত 'name' ও 'due' কলাম লাগবে।"); process.exit(1); }

const warnings = [];
const rows = body.map((r, n) => {
  const get = (k) => (idx[k] === undefined ? "" : (r[idx[k]] || "").trim());
  const name = get("name"), phone = get("phone").replace(/[\s-]/g, "");
  const due = Number(get("due").replace(/[,৳\s]/g, "") || 0);
  if (!name) warnings.push(`লাইন ${n + 2}: নাম নেই — বাদ`);
  if (Number.isNaN(due)) warnings.push(`লাইন ${n + 2} (${name}): due সংখ্যা নয় — বাদ`);
  if (phone && !/^01\d{9}$/.test(phone)) warnings.push(`লাইন ${n + 2} (${name}): ফোন '${phone}' BD ফরম্যাট নয় — ফোন ছাড়া ইমপোর্ট হবে`);
  return { name, phone: /^01\d{9}$/.test(phone) ? phone : "", address: get("address"), paisa: Math.round(due * 100), tags: tagsFrom(name), bad: !name || Number.isNaN(due) };
}).filter((r) => !r.bad);

const dueTotal = rows.filter((r) => r.paisa > 0).reduce((s, r) => s + r.paisa, 0) / 100;
const advTotal = rows.filter((r) => r.paisa < 0).reduce((s, r) => s - r.paisa, 0) / 100;
console.log(`\nপঠিত সারি: ${rows.length} | মোট Due: ৳${dueTotal.toLocaleString("en-IN")} | মোট Advance: ৳${advTotal.toLocaleString("en-IN")}`);
console.log(`Cement ট্যাগ: ${rows.filter((r) => r.tags.includes("cement")).length} | Rod ট্যাগ: ${rows.filter((r) => r.tags.includes("rod")).length} | ট্যাগহীন: ${rows.filter((r) => !r.tags.length).length}`);
warnings.forEach((w) => console.log("⚠", w));
if (expect !== null) console.log(dueTotal === expect ? `✔ ক্লায়েন্টের মোট ৳${expect.toLocaleString("en-IN")}-এর সাথে মিলেছে` : `✘ মিলছে না! প্রত্যাশিত ৳${expect.toLocaleString("en-IN")}, পাওয়া ৳${dueTotal.toLocaleString("en-IN")} (পার্থক্য ৳${(dueTotal - expect).toLocaleString("en-IN")})`);
if (!commit) { console.log("\nএটি ড্রাই-রান ছিল — কিছু লেখা হয়নি। সব ঠিক থাকলে শেষে --commit যোগ করুন।"); process.exit(0); }
if (expect !== null && dueTotal !== expect) { console.error("\nমোট না মেলায় ইমপোর্ট বন্ধ। CSV ঠিক করে আবার চালান।"); process.exit(1); }

const { default: mongoose } = await import("mongoose");
const { default: Customer } = await import("../src/models/Customer.js");
const { default: LedgerEntry } = await import("../src/models/LedgerEntry.js");
await mongoose.connect(process.env.MONGODB_URI);
const date = new Date(`${dateKey}T00:00:00+06:00`);
let created = 0, skipped = 0;
for (const r of rows) {
  if (await Customer.exists({ name: r.name, phone: r.phone })) { skipped++; continue; } // আবার চালালে ডুপ্লিকেট হয় না
  const c = await Customer.create({ name: r.name, phone: r.phone, address: r.address, tags: r.tags, balance: r.paisa });
  if (r.paisa !== 0) {
    await LedgerEntry.create({
      partyType: "customer", partyId: c._id, date, type: r.paisa > 0 ? "opening_due" : "advance",
      debit: r.paisa > 0 ? r.paisa : 0, credit: r.paisa < 0 ? -r.paisa : 0,
      description: r.paisa > 0 ? "Opening due balance" : "Opening advance", balanceAfter: r.paisa,
    });
  }
  created++;
}
const [agg] = await Customer.aggregate([{ $match: { balance: { $gt: 0 } } }, { $group: { _id: null, t: { $sum: "$balance" } } }]);
console.log(`\n✔ তৈরি: ${created} | বাদ (আগেই ছিল): ${skipped}`);
console.log(`✔ সিস্টেমে এখন মোট Receivable: ৳${((agg?.t || 0) / 100).toLocaleString("en-IN")}`);
await mongoose.disconnect();
