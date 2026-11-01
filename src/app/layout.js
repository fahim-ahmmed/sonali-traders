import { Inter, Hind_Siliguri } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bangla = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-bangla", display: "swap" });

export const metadata = { title: "Sonali Trading", description: "Rod & Cement business management" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${bangla.variable}`}>
      <body className="font-sans"><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
