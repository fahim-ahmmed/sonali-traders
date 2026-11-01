import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI .env.local এ সেট করুন");

const g = globalThis;
g._sonali ??= { client: null, mongoose: null };

// Better Auth-এর জন্য native client
export const mongoClient = (g._sonali.client ??= new MongoClient(uri));
export const nativeDb = mongoClient.db();

// Mongoose (মডেলের জন্য)
export async function connectDB() {
  if (g._sonali.mongoose) return g._sonali.mongoose;
  g._sonali.mongoose = mongoose.connect(uri, { bufferCommands: false });
  return g._sonali.mongoose;
}
