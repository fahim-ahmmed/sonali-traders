import { z } from "zod";
import { BD_PHONE } from "./regex.js";
import { isValidId } from "./ids.js";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(150),
  phone: z.string().trim().optional().default("").refine((v) => !v || BD_PHONE.test(v), "Phone must look like 01XXXXXXXXX"),
  address: z.string().trim().max(300).optional().default(""),
});

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const paymentSchema = z.object({
  amount: z.number().int().positive("Enter an amount more than 0"), // পয়সা
  date: dateKey,
  note: z.string().trim().max(200).optional().default(""),
});

export const openingDueSchema = paymentSchema.extend({
  customerId: z.string().refine(isValidId, "Select a customer"),
});
