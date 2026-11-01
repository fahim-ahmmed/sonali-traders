import mongoose from "mongoose";
export const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
