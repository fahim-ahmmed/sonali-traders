import { z } from "zod";
import { isValidId } from "./ids.js";

// দাম পয়সায় (integer)
export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  categoryId: z.string().refine(isValidId, "Select a category and brand"),
  buyPrice: z.number().int().min(0, "Buying price can't be negative").optional().default(0),
  sellPrice: z.number().int().min(0, "Selling price can't be negative"),
});

export const productDto = (p, cat) => ({
  id: String(p._id),
  name: p.name,
  categoryId: String(p.categoryId),
  category: cat?.category ?? "",
  brand: p.brand,
  buyPrice: p.buyPrice,
  sellPrice: p.sellPrice,
  stock: p.stock,
});
