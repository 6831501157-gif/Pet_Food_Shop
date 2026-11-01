import { useMemo } from "react";
import { formatBaht } from "@/lib/format";
import { isLowStock, LOW_STOCK_THRESHOLD, type Product } from "@/lib/products";

export function StatsBar({ products }: { products: Product[] }) {
  const stats = useMemo(
    () => ({
      count: products.length,
      units: products.reduce((sum, p) => sum + p.stock_qty, 0),
      value: products.reduce((sum, p) => sum + p.sell_price * p.stock_qty, 0),
      lowStock: products.filter((p) => isLowStock(p.stock_qty)).length,
    }),
    [products]
  );

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="สินค้าทั้งหมด" value={`${stats.count} รายการ`} />
      <Stat label="สต็อกรวม" value={`${stats.units.toLocaleString("th-TH")} หน่วย`} />
      <Stat label="มูลค่าสต็อก (ราคาขาย)" value={formatBaht(stats.value)} />
      <Stat
        label={`ใกล้หมด (≤ ${LOW_STOCK_THRESHOLD})`}
        value={`${stats.lowStock} รายการ`}
        warn={stats.lowStock > 0}
      />
    </section>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        warn ? "border-red-200" : "border-stone-200"
      }`}
    >
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${warn ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
