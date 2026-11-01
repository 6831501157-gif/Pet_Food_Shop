import { StepperButton } from "@/components/StepperButton";
import type { LoadStatus } from "@/hooks/useCatalog";
import { formatBaht } from "@/lib/format";
import { isLowStock, type Product } from "@/lib/products";

type ProductTableProps = {
  products: Product[];
  status: LoadStatus;
  onAdjustStock: (product: Product, delta: -1 | 1) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const COLUMN_COUNT = 6;

export function ProductTable({ products, status, ...actions }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">รหัส</th>
            <th className="px-4 py-3">ชื่อสินค้า</th>
            <th className="px-4 py-3">หมวดหมู่</th>
            <th className="px-4 py-3 text-right">ราคาขาย</th>
            <th className="px-4 py-3 text-center">สต็อก</th>
            <th className="px-4 py-3 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {status === "loading" ? (
            <MessageRow>กำลังโหลด…</MessageRow>
          ) : status === "error" ? (
            <MessageRow>โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</MessageRow>
          ) : products.length === 0 ? (
            <MessageRow>ไม่พบสินค้า</MessageRow>
          ) : (
            products.map((p) => <ProductRow key={p.product_id} product={p} {...actions} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function MessageRow({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="px-4 py-10 text-center text-stone-400">
        {children}
      </td>
    </tr>
  );
}

function ProductRow({
  product: p,
  onAdjustStock,
  onEdit,
  onDelete,
}: Omit<ProductTableProps, "products" | "status"> & { product: Product }) {
  return (
    <tr className="hover:bg-stone-50/70">
      <td className="px-4 py-3 tabular-nums text-stone-500">{p.product_id}</td>
      <td className="px-4 py-3 font-medium">{p.product_name}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
          {p.category_name}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{formatBaht(p.sell_price)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <StepperButton
            step={-1}
            label="ลดสต็อก"
            onClick={() => onAdjustStock(p, -1)}
            disabled={p.stock_qty === 0}
          />
          <span
            className={`min-w-16 text-center tabular-nums ${
              isLowStock(p.stock_qty) ? "font-semibold text-red-600" : ""
            }`}
          >
            {p.stock_qty} {p.unit}
          </span>
          <StepperButton step={1} label="เพิ่มสต็อก" onClick={() => onAdjustStock(p, 1)} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button
          onClick={() => onEdit(p)}
          className="rounded-md px-3 py-1.5 text-emerald-700 hover:bg-emerald-50"
        >
          แก้ไข
        </button>
        <button
          onClick={() => onDelete(p)}
          className="rounded-md px-3 py-1.5 text-red-600 hover:bg-red-50"
        >
          ลบ
        </button>
      </td>
    </tr>
  );
}
