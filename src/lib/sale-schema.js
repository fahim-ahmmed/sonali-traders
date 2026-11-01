import { z } from "zod";
import { isValidId } from "./ids.js";

export const saleSchema = z.object({
  clientRef: z.string().min(8).max(80),
  customerId: z.string().refine(isValidId, "Select a customer"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a sale date"),
  items: z.array(z.object({
    productId: z.string().refine(isValidId, "Select a product"),
    qty: z.number().positive("Quantity must be more than 0"),
    rate: z.number().int().min(0, "Selling price can't be negative"), // পয়সা
  })).default([]),
  paid: z.number().int().min(0, "Paid amount can't be negative").default(0),
  remarks: z.string().trim().max(300).optional().default(""),
  trackNumber: z.string().trim().max(60).optional().default(""),
}).refine((d) => d.items.length > 0 || d.paid > 0, { message: "Add products for a sale, or enter a payment amount" });
