// Product types and rules shared by client and server, so keep this free of mysql2 imports
import { asRecord, fail, isNonNegativeInt, isPositiveInt, ok, type ParseResult } from "./parse";

export type Category = { category_id: number; category_name: string };

export type Product = {
  product_id: number;
  category_id: number;
  category_name?: string;
  product_name: string;
  sell_price: number;
  stock_qty: number;
  unit: string;
};

export type ProductInput = Omit<Product, "product_id" | "category_name">;

export const LOW_STOCK_THRESHOLD = 5;

// Column sizes in the products table
const MAX_NAME_LENGTH = 200;
const MAX_UNIT_LENGTH = 30;

export const isLowStock = (stockQty: number) => stockQty <= LOW_STOCK_THRESHOLD;

export type ProductFilter = {
  search: string;
  /** null means every category */
  categoryId: number | null;
};

// Matches by category, then by name substring or exact product id
export function filterProducts(products: Product[], { search, categoryId }: ProductFilter) {
  const query = search.trim().toLowerCase();
  return products.filter(
    (p) =>
      (categoryId === null || p.category_id === categoryId) &&
      (!query || p.product_name.toLowerCase().includes(query) || String(p.product_id) === query)
  );
}

export function parseProductInput(body: unknown): ParseResult<ProductInput> {
  const raw = asRecord(body);
  const input: ProductInput = {
    category_id: Number(raw.category_id),
    product_name: String(raw.product_name ?? "").trim(),
    sell_price: Number(raw.sell_price),
    stock_qty: Number(raw.stock_qty),
    unit: String(raw.unit ?? "").trim(),
  };

  if (!input.product_name) return fail("กรุณากรอกชื่อสินค้า");
  if (input.product_name.length > MAX_NAME_LENGTH)
    return fail(`ชื่อสินค้ายาวเกิน ${MAX_NAME_LENGTH} ตัวอักษร`);
  if (!isPositiveInt(input.category_id)) return fail("กรุณาเลือกหมวดหมู่");
  if (!(input.sell_price >= 0)) return fail("ราคาขายต้องเป็นตัวเลขไม่ติดลบ");
  if (!isNonNegativeInt(input.stock_qty)) return fail("จำนวนสต็อกต้องเป็นจำนวนเต็มไม่ติดลบ");
  if (!input.unit) return fail("กรุณากรอกหน่วย");
  if (input.unit.length > MAX_UNIT_LENGTH) return fail(`หน่วยยาวเกิน ${MAX_UNIT_LENGTH} ตัวอักษร`);
  return ok(input);
}
