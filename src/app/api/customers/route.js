import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { esc } from "@/lib/regex";
import { customerSchema } from "@/lib/customer-schema";
import { customerDto } from "@/lib/ledger";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

// ঢাকা টাইমজোন অনুযায়ী গত মাসের শুরু ও শেষের তারিখ বের করা
function getPreviousMonthRange() {
  const nowStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const [y, m] = nowStr.split("-").map(Number);
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const nextYear = y;
  const nextMonth = m;

  const start = new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00+06:00`);
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+06:00`);
  return { start, end };
}

export async function GET(req) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const category = (sp.get("category") || "").toLowerCase();
  const sub = (sp.get("sub") || "").trim();
  const due = sp.get("due") === "1";
  const isExport = sp.get("export") === "1";
  const sort = sp.get("sort") === "due" || due ? { balance: -1, name: 1 } : { name: 1 };
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = isExport ? 10000 : Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));

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
    Customer.find(filter)
      .sort(sort)
      .skip(isExport ? 0 : (page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  // কাস্টমারদের Average Sale এবং Last Month Collection হিসাব করা
  const customerIds = items.map((c) => c._id);
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [saleStats, collectionStats] = customerIds.length
    ? await Promise.all([
        LedgerEntry.aggregate([
          {
            $match: {
              partyType: "customer",
              partyId: { $in: customerIds },
              type: "sale",
              debit: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: "$partyId",
              avgSale: { $avg: "$debit" },
              totalSale: { $sum: "$debit" },
              saleCount: { $sum: 1 },
            },
          },
        ]),
        LedgerEntry.aggregate([
          {
            $match: {
              partyType: "customer",
              partyId: { $in: customerIds },
              credit: { $gt: 0 },
              date: { $gte: prevStart, $lt: prevEnd },
            },
          },
          {
            $group: {
              _id: "$partyId",
              lastMonthCollection: { $sum: "$credit" },
            },
          },
        ]),
      ])
    : [[], []];

  const saleMap = new Map(saleStats.map((s) => [String(s._id), Math.round(s.avgSale || 0)]));
  const colMap = new Map(collectionStats.map((c) => [String(c._id), Math.round(c.lastMonthCollection || 0)]));

  const enrichedItems = items.map((c) => {
    const dto = customerDto(c);
    const computedAvgSale = saleMap.get(dto.id) || 0;
    const computedLastMonthCol = colMap.get(dto.id) || 0;

    return {
      ...dto,
      avgSale: c.manualAvgSale !== null && c.manualAvgSale !== undefined ? c.manualAvgSale : computedAvgSale,
      lastMonthCollection:
        c.manualLastMonthCollection !== null && c.manualLastMonthCollection !== undefined
          ? c.manualLastMonthCollection
          : computedLastMonthCol,
      computedAvgSale,
      computedLastMonthCol,
      hasManualAvgSale: c.manualAvgSale !== null && c.manualAvgSale !== undefined,
      hasManualLastMonthCol: c.manualLastMonthCollection !== null && c.manualLastMonthCollection !== undefined,
    };
  });

  return ok({
    items: enrichedItems,
    total,
    page: isExport ? 1 : page,
    pages: isExport ? 1 : Math.max(1, Math.ceil(total / limit)),
  });
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