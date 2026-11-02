import { z } from "zod";
import { isValidDateKey } from "./dates.js";

export const expenseSchema = z.object({
  date: z.string().refine(isValidDateKey, "Choose a valid expense date"),
  amount: z.number().int().positive("Enter an amount more than 0"), // পয়সা
  purpose: z.string().trim().min(1, "Tell us what the expense was for").max(100),
  note: z.string().trim().max(300).optional().default(""),
  paidById: z.string().optional(), // শুধু Admin বাছতে পারে
});

export const expenseDto = (e) => ({
  id: String(e._id), date: e.date, amount: e.amount, purpose: e.purpose, note: e.note,
  paidByType: e.paidByType, paidById: e.paidById, paidByName: e.paidByName,
});
