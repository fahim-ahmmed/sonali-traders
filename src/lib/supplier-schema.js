import { z } from "zod";
import { BD_PHONE } from "./regex.js";

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Supplier name is required").max(100),
  company: z.string().trim().max(100).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  phone: z.string().trim().optional().default("").refine((v) => !v || BD_PHONE.test(v), "Phone must look like 01XXXXXXXXX"),
});
export const supplierDto = (s) => ({ id: String(s._id), name: s.name, company: s.company, address: s.address, phone: s.phone });
