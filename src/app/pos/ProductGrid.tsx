import type { LoadStatus } from "@/hooks/useCatalog";
import { formatBaht } from "@/lib/format";
import { isLowStock, type Product } from "@/lib/products";

type ProductGridProps = {
  products: Product[];
  status: LoadStatus;
  /** How many of each product are already in the cart */
  quantityInCart: Map<number, number>;
  onAdd: (product: Product) => void;
};

export function ProductGrid({ products, status, quantityInCart, onAdd }: ProductGridProps) {
  if (status === "loading") return <EmptyMessage>กำลังโหลด…</EmptyMessage>;
  if (status === "error") return <EmptyMessage>โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</EmptyMessage>;
  if (products.length === 0) return <EmptyMessage>ไม่พบสินค้า</EmptyMessage>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.product_id}
          product={p}
          inCart={quantityInCart.get(p.product_id) ?? 0}
          onAdd={() => onAdd(p)}
        />
      ))}
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-stone-400">{children}</p>;
}

function ProductCard({
  product,
  inCart,
  onAdd,
}: {
  product: Product;
  inCart: number;
  onAdd: () => void;
}) {
  const remaining = product.stock_qty - inCart;
  const soldOut = remaining <= 0;

  return (
    <button
      onClick={onAdd}
      disabled={soldOut}
      className="relative flex flex-col rounded-xl border border-stone-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-500 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {inCart > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
          {inCart}
        </span>
      )}
      <span className="text-xs text-emerald-700">{product.category_name}</span>
      <span className="mt-1 line-clamp-2 min-h-10 pr-6 text-sm font-medium leading-5">
        {product.product_name}
      </span>
      <span className="mt-2 font-semibold tabular-nums">{formatBaht(product.sell_price)}</span>
      <span className={`text-xs ${isLowStock(remaining) ? "text-red-600" : "text-stone-500"}`}>
        {soldOut ? "หมดสต็อก" : `เหลือ ${remaining} ${product.unit}`}
      </span>
    </button>
  );
}
