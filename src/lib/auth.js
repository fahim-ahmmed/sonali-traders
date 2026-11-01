import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nativeDb, mongoClient } from "./db.js";

export const auth = betterAuth({
  database: mongodbAdapter(nativeDb, { client: mongoClient }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // পাবলিক সাইনআপ বন্ধ; শুধু seed (ALLOW_SIGNUP=true) বা Admin স্টাফ তৈরি করবে
    disableSignUp: process.env.ALLOW_SIGNUP !== "true",
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "staff", input: false },
      // JSON string: ["pos","purchase"]
      permissions: { type: "string", required: false, defaultValue: "[]", input: false },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
});
