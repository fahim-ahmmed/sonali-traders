import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nativeDb, mongoClient } from "./db.js";

// শুধু সার্ভার-কোড থেকে স্টাফ অ্যাকাউন্ট তৈরির জন্য। এর HTTP হ্যান্ডলার কোথাও মাউন্ট করা নেই,
// তাই পাবলিক সাইনআপ বন্ধই থাকে। autoSignIn বন্ধ — নতুন স্টাফের নামে সেশন তৈরি হয় না।
export const authAdmin = betterAuth({
  database: mongodbAdapter(nativeDb, { client: mongoClient }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, disableSignUp: false, autoSignIn: false, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "staff", input: false },
      permissions: { type: "string", required: false, defaultValue: "[]", input: false },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
});
