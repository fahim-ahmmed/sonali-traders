import { Suspense } from "react";
import CustomerListClient from "./CustomerListClient";

export default function CustomersPage() {
  return <Suspense fallback={null}><CustomerListClient /></Suspense>;
}
