import { z } from "zod";
import { isValidId } from "./ids.js";
import { dhakaDateKey } from "./dates.js";

export const purchaseSchema = z.object({
  supplierId: z.string().refine(isValidId, "Select a supplier"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a purchase date"),
  stockControl: z.boolean().default(true),
  items: z.array(z.object({
    productId: z.string().refine(isValidId, "Select a product"),
    qty: z.number().positive("Quantity must be more than 0"),
    buyPrice: z.number().int().min(0, "Buying price can't be negative"), // পয়সা
  })).min(1, "Add at least one product"),
  paidAmount: z.number().int().min(0).nullable().optional(),
});

export const purchaseDto = (p, s) => ({
  id: String(p._id),
  date: p.date,
  dateKey: dhakaDateKey(p.date),
  supplierId: String(s?._id ?? p.supplierId),
  supplier: s?.name ?? "",
  company: s?.company ?? "",
  stockControl: p.stockControl,
  grandTotal: p.grandTotal,
  paidAmount: p.paidAmount,
  items: p.items.map((i) => ({
    productId: String(i.productId),
    name: i.name,
    category: i.category || "",
    brand: i.brand || "",
    qty: i.qty,
    rate: i.rate ?? i.buyPrice,
    buyPrice: i.buyPrice,
    lineTotal: i.lineTotal,
  })),
});
