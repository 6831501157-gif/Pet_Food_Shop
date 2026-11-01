// Sale request shape and validation, shared by client and server
import { asRecord, fail, isPositiveInt, ok, type ParseResult } from "./parse";
import { isPaymentMethod, type PaymentMethod } from "./payments";

export type SaleItem = { product_id: number; quantity: number };

export type SaleRequest = { payment_method: PaymentMethod; items: SaleItem[] };

export type SaleResult = { sale_id: number; total_amount: number };

export function parseSaleRequest(body: unknown): ParseResult<SaleRequest> {
  const raw = asRecord(body);
  if (!isPaymentMethod(raw.payment_method)) return fail("วิธีชำระเงินไม่ถูกต้อง");

  const items = mergeItems(Array.isArray(raw.items) ? raw.items : []);
  if (items.length === 0) return fail("ยังไม่มีสินค้าในตะกร้า");

  return ok({ payment_method: raw.payment_method, items });
}

// Merge duplicate lines so the stock check sees the full quantity per product.
// Lines with an invalid id or quantity are dropped.
function mergeItems(rawItems: unknown[]): SaleItem[] {
  const quantityById = new Map<number, number>();
  for (const entry of rawItems) {
    const { product_id, quantity } = asRecord(entry);
    if (!isPositiveInt(product_id) || !isPositiveInt(quantity)) continue;
    quantityById.set(product_id, (quantityById.get(product_id) ?? 0) + quantity);
  }
  return [...quantityById].map(([product_id, quantity]) => ({ product_id, quantity }));
}
