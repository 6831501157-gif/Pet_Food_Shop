"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/pos", label: "ขายสินค้า" },
  { href: "/products", label: "จัดการสินค้า" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6">
        <span className="py-3 font-bold text-emerald-800">🌾 ร้านอาหารสัตว์</span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 px-3 py-3 text-sm ${
                pathname.startsWith(l.href)
                  ? "border-emerald-700 font-medium text-emerald-800"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
