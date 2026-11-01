"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import type { SaleItem } from "@/lib/sales";

export type CartLine = { product: Product; quantity: number };

export const lineTotal = (line: CartLine) => line.product.sell_price * line.quantity;

export const toSaleItem = (line: CartLine): SaleItem => ({
  product_id: line.product.product_id,
  quantity: line.quantity,
});

const clampToStock = (quantity: number, product: Product) =>
  Math.min(Math.max(0, quantity), product.stock_qty);

/** Cart lines, capped at each product's stock */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  const quantityById = useMemo(
    () => new Map(lines.map((l) => [l.product.product_id, l.quantity])),
    [lines]
  );
  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  function add(product: Product) {
    setLines((current) => {
      const existing = current.find((l) => l.product.product_id === product.product_id);
      if (!existing) return [...current, { product, quantity: 1 }];
      if (existing.quantity >= product.stock_qty) return current;
      return current.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
    });
  }

  /** Setting 0 removes the line */
  function setQuantity(productId: number, quantity: number) {
    setLines((current) =>
      current
        .map((l) =>
          l.product.product_id === productId
            ? { ...l, quantity: clampToStock(quantity, l.product) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  const clear = () => setLines([]);

  return { lines, quantityById, total, itemCount, add, setQuantity, clear };
}
