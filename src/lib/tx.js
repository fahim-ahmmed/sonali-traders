import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { fail } from "./api.js";

export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// MongoDB transaction — ব্যর্থ হলে পুরোটা rollback
export async function withTx(fn) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let out;
    await session.withTransaction(async () => { out = await fn(session); });
    return out;
  } finally {
    await session.endSession();
  }
}

export function handleError(e) {
  if (e instanceof AppError) return fail(e.message, e.status);
  console.error(e);
  return fail("Something went wrong. Please try again.", 500);
}

export const dateFromKey = (key) => new Date(`${key}T00:00:00+06:00`); // Asia/Dhaka দিন
