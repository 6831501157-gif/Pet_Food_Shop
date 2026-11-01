"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/SearchInput";
import { Toast } from "@/components/Toast";
import { useCatalog } from "@/hooks/useCatalog";
import { useToast } from "@/hooks/useToast";
import { api, getErrorMessage } from "@/lib/api-client";
import { filterProducts, type Product } from "@/lib/products";
import { DeleteProductModal } from "./DeleteProductModal";
import { ProductFormModal } from "./ProductFormModal";
import { ProductTable } from "./ProductTable";
import { StatsBar } from "./StatsBar";

// Only one dialog can be open at a time
type Dialog =
  | { kind: "create" }
  | { kind: "edit"; product: Product }
  | { kind: "delete"; product: Product }
  | null;

export default function ProductManager() {
  const { products, setProducts, categories, status, reload } = useCatalog();
  const { toast, showToast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const visibleProducts = useMemo(
    () => filterProducts(products, { search, categoryId }),
    [products, search, categoryId]
  );

  const closeDialog = () => setDialog(null);

  function setStock(productId: number, stock_qty: number) {
    setProducts((all) => all.map((p) => (p.product_id === productId ? { ...p, stock_qty } : p)));
  }

  async function adjustStock(product: Product, delta: -1 | 1) {
    setStock(product.product_id, Math.max(0, product.stock_qty + delta)); // optimistic
    try {
      const { stock_qty } = await api.adjustStock(product.product_id, delta);
      setStock(product.product_id, stock_qty);
    } catch {
      showToast({ text: "ปรับสต็อกไม่สำเร็จ", error: true });
      reload();
    }
  }

  function handleSaved(message: string) {
    closeDialog();
    showToast({ text: message });
    reload();
  }

  async function deleteProduct(product: Product) {
    closeDialog();
    try {
      await api.deleteProduct(product.product_id);
      showToast({ text: `ลบ "${product.product_name}" แล้ว` });
      reload();
    } catch (error) {
      showToast({ text: getErrorMessage(error, "ลบไม่สำเร็จ"), error: true });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
        <button
          onClick={() => setDialog({ kind: "create" })}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-emerald-800"
        >
          + เพิ่มสินค้า
        </button>
      </header>

      <StatsBar products={products} />

      <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} className="flex-1 py-2" />
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-emerald-600"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        <ProductTable
          products={visibleProducts}
          status={status}
          onAdjustStock={adjustStock}
          onEdit={(product) => setDialog({ kind: "edit", product })}
          onDelete={(product) => setDialog({ kind: "delete", product })}
        />

        {status === "ready" && (
          <p className="border-t border-stone-200 px-4 py-3 text-xs text-stone-500">
            แสดง {visibleProducts.length} จาก {products.length} รายการ
          </p>
        )}
      </section>

      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <ProductFormModal
          product={dialog.kind === "edit" ? dialog.product : undefined}
          defaultCategoryId={categoryId}
          categories={categories}
          onClose={closeDialog}
          onSaved={handleSaved}
        />
      )}

      {dialog?.kind === "delete" && (
        <DeleteProductModal
          product={dialog.product}
          onCancel={closeDialog}
          onConfirm={() => deleteProduct(dialog.product)}
        />
      )}

      <Toast toast={toast} />
    </main>
  );
}
