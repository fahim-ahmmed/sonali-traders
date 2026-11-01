import { z } from "zod";
import { BD_PHONE } from "./regex.js";
import { STAFF_PERMISSIONS } from "./permissions.js";

const keys = STAFF_PERMISSIONS.map((p) => p.key);
const base = {
  name: z.string().trim().min(1, "Staff name is required").max(100),
  designation: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().optional().default("").refine((v) => !v || BD_PHONE.test(v), "Phone must look like 01XXXXXXXXX"),
  salary: z.number().int().min(0, "Salary can't be negative").default(0), // পয়সা
  address: z.string().trim().max(300).optional().default(""),
  permissions: z.array(z.enum(keys)).default([]),
};
export const staffCreateSchema = z.object({
  ...base,
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});
export const staffUpdateSchema = z.object(base);
export const resetSchema = z.object({ password: z.string().min(8, "Password must be at least 8 characters").max(100) });

export const staffDto = (s, user) => ({
  id: String(s._id), userId: s.userId, name: s.name, designation: s.designation, phone: s.phone,
  salary: s.salary, address: s.address, email: s.email,
  permissions: (() => { try { return JSON.parse(user?.permissions || "[]"); } catch { return []; } })(),
});
