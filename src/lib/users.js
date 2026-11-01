import { ObjectId } from "mongodb";
import { nativeDb } from "./db.js";

// Better Auth-এর userId কোথাও string, কোথাও ObjectId হতে পারে — দুটোই মেলানো হয়
export const idMatch = (id) => ({ $in: [String(id), ...(ObjectId.isValid(id) ? [new ObjectId(String(id))] : [])] });

export const users = () => nativeDb.collection("user");
export const sessions = () => nativeDb.collection("session");
export const accounts = () => nativeDb.collection("account");

export async function findUserById(id) {
  if (!ObjectId.isValid(id)) return null;
  return users().findOne({ _id: new ObjectId(String(id)) });
}

export async function findStaffUser(staff) {
  const user = await findUserById(staff.userId);
  return user && user.email?.toLowerCase() === staff.email?.toLowerCase() ? user : null;
}
