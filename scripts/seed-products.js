import mongoose from "mongoose";
import { connectDB, mongoClient } from "../src/lib/db.js";
import { formatMoney } from "../src/lib/money.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";
import { CATEGORY_BRANDS, PRODUCTS } from "./product-catalog-data.js";

const expectedSellingTotal = 304601;

try {
  await connectDB();

  const categoriesByKey = new Map();
  for (const [category, brand] of CATEGORY_BRANDS) {
    const saved = await Category.findOneAndUpdate(
      { category, brand },
      { $setOnInsert: { category, brand } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoriesByKey.set(`${category}|${brand}`, saved);
  }

  const seededProductIds = [];
  for (const [name, category, brand, sellPrice] of PRODUCTS) {
    const linkedCategory = categoriesByKey.get(`${category}|${brand}`);
    const selector = { name, categoryId: linkedCategory._id, brand };
    await Product.updateOne({ ...selector, buyPrice: 0 }, { $set: { buyPrice: null } });
    const saved = await Product.findOneAndUpdate(
      selector,
      {
        $setOnInsert: {
          ...selector,
          buyPrice: null,
          sellPrice,
          stock: 0,
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededProductIds.push(saved._id);
  }

  const [categoryCount, seededProducts] = await Promise.all([
    Category.countDocuments({ _id: { $in: [...categoriesByKey.values()].map(({ _id }) => _id) } }),
    Product.find({ _id: { $in: seededProductIds } }).select("sellPrice").lean(),
  ]);
  const sellingTotal = seededProducts.reduce((total, product) => total + product.sellPrice, 0);

  console.log(`Products: ${seededProducts.length}`);
  console.log(`Category-brand pairs: ${categoryCount}`);
  console.log(`Selling price total: ${formatMoney(sellingTotal)}`);
  if (seededProducts.length !== PRODUCTS.length || categoryCount !== CATEGORY_BRANDS.length || sellingTotal !== expectedSellingTotal) {
    throw new Error(
      `Product seed verification failed: expected ${PRODUCTS.length} products, ${CATEGORY_BRANDS.length} category-brand pairs, and ${formatMoney(expectedSellingTotal)} total selling price.`
    );
  }
} finally {
  await mongoose.disconnect();
  await mongoClient.close();
}
