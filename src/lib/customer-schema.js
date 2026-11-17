import { z } from "zod";
import { BD_PHONE } from "./regex.js";
import { isValidId } from "./ids.js";
import { isValidDateKey } from "./dates.js";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(150),
  phone: z.string().trim().optional().default("").refine((v) => !v || BD_PHONE.test(v), "Phone must look like 01XXXXXXXXX"),
  address: z.string().trim().max(300).optional().default(""),
  category: z.enum(["", "cement", "rod", "general"], { errorMap: () => ({ message: "Choose a valid category" }) }).optional().default(""),
  subCategory: z.string().trim().max(100).optional().default(""),
});

// সেভ করার আগে ক্যাটাগরি স্বাভাবিক করা: সাব-ক্যাটাগরি শুধু cement/rod-এ থাকে, আর tags মিলিয়ে রাখা (লিস্ট ফিল্টারের জন্য)
export function normalizeCustomerCategory(data) {
  const category = data.category || "";
  const out = {
    ...data,
    category,
    subCategory: ["cement", "rod"].includes(category) ? data.subCategory || "" : "",
  };
  if (category) out.tags = category === "general" ? [] : [category];
  return out;
}

// ডাটাবেসের কাস্টমার থেকে category/subCategory বের করা; পুরনো কাস্টমারদের ক্ষেত্রে tags থেকে category ধরা
export function customerCategoryInfo(c) {
  const tags = c?.tags || [];
  const category = c?.category || (tags.includes("cement") ? "cement" : tags.includes("rod") ? "rod" : "");
  return { category, subCategory: c?.subCategory || "" };
}

const dateKey = z.string().refine(isValidDateKey, "Choose a valid date");

export const paymentSchema = z.object({
  amount: z.number().int().positive("Enter an amount more than 0"), // পয়সা
  date: dateKey,
  note: z.string().trim().max(200).optional().default(""),
});

export const openingDueSchema = paymentSchema.extend({
  customerId: z.string().refine(isValidId, "Select a customer"),
});