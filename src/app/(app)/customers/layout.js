import { guard } from "@/lib/guard";

export default async function Layout({ children }) {
  await guard("customer_list");
  return children;
}
