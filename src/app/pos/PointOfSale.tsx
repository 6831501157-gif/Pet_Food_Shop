"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/SearchInput";
import { useCatalog } from "@/hooks/useCatalog";
import { api, getErrorMessage } from "@/lib/api-client";
import { filterProducts, type Product } from "@/lib/products";
import { CartList } from "./CartList";
import { CategoryChips } from "./CategoryChips";
import { CheckoutPanel } from "./CheckoutPanel";
import { ProductGrid } from "./ProductGrid";
import { ReceiptModal, type Receipt } from "./ReceiptModal";
import { toSaleItem, useCart } from "./useCart";

export default function PointOfSale() {
  const { products, categories, status, reload } = useCatalog();
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const visibleProducts = useMemo(
    () => filterProducts(products, { search, categoryId }),
    [products, search, categoryId]
  );

  const receivedAmount = cashReceived !== "" ? Number(cashReceived) : undefined;
  const isCashShort = receivedAmount !== undefined && receivedAmount < cart.total;
  const canCheckout = cart.lines.length > 0 && !isCashShort && !submitting;

  function addToCart(product: Product) {
    setError("");
    cart.add(product);
  }

  async function checkout() {
    if (!canCheckout) return;
    setSubmitting(true);
    setError("");
    try {
      const sale = await api.createSale({
        payment_method: "cash",
        items: cart.lines.map(toSaleItem),
      });
      setReceipt({
        sale_id: sale.sale_id,
        lines: cart.lines,
        total: sale.total_amount,
        payment_method: "cash",
        received: receivedAmount,
        date: new Date(),
      });
      cart.clear();
      setCashReceived("");
    } catch (err) {
      setError(getErrorMessage(err, "ขายไม่สำเร็จ"));
    } finally {
      setSubmitting(false);
      reload(); // refresh stock either way
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <h1 className="mb-4 text-2xl font-bold">ขายสินค้า</h1>
        <SearchInput value={search} onChange={setSearch} className="mb-3 w-full py-2.5" />
        <CategoryChips categories={categories} selected={categoryId} onSelect={setCategoryId} />
        <ProductGrid
          products={visibleProducts}
          status={status}
          quantityInCart={cart.quantityById}
          onAdd={addToCart}
        />
      </section>

      <aside className="h-fit rounded-xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-6">
        <CartList
          lines={cart.lines}
          itemCount={cart.itemCount}
          onClear={cart.clear}
          onSetQuantity={cart.setQuantity}
        />
        <CheckoutPanel
          total={cart.total}
          cashReceived={cashReceived}
          onCashReceivedChange={setCashReceived}
          error={error}
          submitting={submitting}
          canCheckout={canCheckout}
          onCheckout={checkout}
        />
      </aside>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </main>
  );
}
