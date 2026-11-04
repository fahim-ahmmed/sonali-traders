import { z } from "zod";
import { isValidId } from "./ids.js";
import { isValidDateKey } from "./dates.js";

export const saleSchema = z.object({
  clientRef: z.string().min(8).max(80),
  customerId: z.string().refine(isValidId, "Select a customer"),
  date: z.string().refine(isValidDateKey, "Choose a valid sale date"),
  items: z.array(z.object({
    productId: z.string().refine(isValidId, "Select a product"),
    qty: z.number().positive("Quantity must be more than 0"),
    rate: z.number().int().min(0, "Selling price can't be negative"), // পয়সা
  })).default([]),
  extraCostLabel: z.string().trim().max(100).optional().default(""),
  extraCost: z.number().int().min(0, "Extra cost can't be negative").optional().default(0), // পয়সা
  paid: z.number().int().min(0, "Paid amount can't be negative").default(0),
  remarks: z.string().trim().max(300).optional().default(""),
  trackNumber: z.string().trim().max(60).optional().default(""),
}).refine((d) => d.items.length > 0 || d.paid > 0 || d.extraCost > 0, { message: "Add products for a sale, or enter a payment amount" });