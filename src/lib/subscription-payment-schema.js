import { z } from "zod";

export const subscriptionPaymentSchema = z.object({
  method: z.enum(["bkash", "nagad"]),
  senderNumber: z.string().regex(/^01\d{9}$/, "Enter a valid 11-digit mobile number"),
  transactionId: z.string().trim().toUpperCase().min(6).max(32).regex(/^[A-Z0-9]+$/, "Transaction ID must use letters and numbers"),
  note: z.string().trim().max(300).optional().default(""),
});

export const paymentPageSchema = z.coerce.number().int().min(1).max(100000);
