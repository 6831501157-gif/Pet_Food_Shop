import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { SqlLogPanel } from "@/components/SqlLogPanel";
import NavBar from "./NavBar";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ร้านอาหารสัตว์",
  description: "ระบบจัดการสินค้าร้านอาหารสัตว์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${notoThai.variable} antialiased`}>
        <NavBar />
        {children}
        <SqlLogPanel />
      </body>
    </html>
  );
}
