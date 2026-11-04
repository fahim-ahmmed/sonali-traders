import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { esc } from "@/lib/regex";
import { customerSchema } from "@/lib/customer-schema";
import { customerDto } from "@/lib/ledger";
import Customer from "@/models/Customer";

export async function GET(req) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const category = (sp.get("category") || "").toLowerCase();
  const sub = (sp.get("sub") || "").trim();
  const due = sp.get("due") === "1";
  const sort = sp.get("sort") === "due" || due ? { balance: -1, name: 1 } : { name: 1 };
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));

  await connectDB();
  const andConditions = [{ active: true }];

  if (q) {
    const r = new RegExp(esc(q), "i");
    andConditions.push({ $or: [{ name: r }, { phone: r }, { address: r }] });
  }
  if (["cement", "rod"].includes(category)) {
    andConditions.push({ tags: category });
  }
  if (sub) {
    const subRegex = new RegExp(esc(sub), "i");
    andConditions.push({ $or: [{ name: subRegex }, { tags: subRegex }] });
  }
  if (due) {
    andConditions.push({ balance: { $gt: 0 } });
  }

  const filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  const [items, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);
  return ok({ items: items.map(customerDto), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req) {
  const { error } = await requireAny(["customer_list", "pos"]);
  if (error) return error;
  const parsed = customerSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const dup = parsed.data.phone ? await Customer.exists({ phone: parsed.data.phone, active: true }) : null;
  const c = await Customer.create(parsed.data);
  return ok({ ...customerDto(c), warning: dup ? "Another customer already uses this phone number" : null }, 201);
}