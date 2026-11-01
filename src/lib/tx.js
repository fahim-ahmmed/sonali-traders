import { fail } from "./api.js";
import { AppError } from "./tx-core.js";
export { AppError, dateFromKey, withTx } from "./tx-core.js";

export function handleError(e) {
  if (e instanceof AppError) return fail(e.message, e.status);
  console.error(e);
  return fail("Something went wrong. Please try again.", 500);
}
