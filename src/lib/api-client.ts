// Typed browser-side wrappers around our API routes
import type { Category, Product, ProductInput } from "./products";
import type { SaleRequest, SaleResult } from "./sales";
import { sqlLog } from "./sql-log";

/** Non-2xx response; message is the server's `error` text, or empty if it sent none */
export class ApiError extends Error {}

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.message ? error.message : fallback;

type RequestOptions<T> = {
  method?: string;
  body?: unknown;
  /** Name shown in the SQL log panel; may use the response (null on failure) */
  logAs?: string | ((data: T | null) => string);
};

async function request<T>(url: string, { method = "GET", body, logAs }: RequestOptions<T> = {}) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (logAs) {
    const action = typeof logAs === "function" ? logAs(res.ok ? data : null) : logAs;
    sqlLog.add(action, data?.sqlLog ?? [], res.ok ? undefined : data?.error);
  }

  if (!res.ok) throw new ApiError(data?.error ?? "");
  return data as T;
}

const sendJson = <T>(method: string, body: unknown, logAs: RequestOptions<T>["logAs"]) => ({
  method,
  body,
  logAs,
});

export const api = {
  listProducts: () => request<Product[]>("/api/products"),
  listCategories: () => request<Category[]>("/api/categories"),

  createProduct: (input: ProductInput) =>
    request<{ product_id: number }>("/api/products", sendJson("POST", input, "เพิ่มสินค้า")),

  updateProduct: (id: number, input: ProductInput) =>
    request<{ ok: true }>(`/api/products/${id}`, sendJson("PUT", input, `แก้ไขสินค้า #${id}`)),

  deleteProduct: (id: number) =>
    request<{ ok: true }>(`/api/products/${id}`, { method: "DELETE", logAs: `ลบสินค้า #${id}` }),

  adjustStock: (id: number, delta: number) =>
    request<{ stock_qty: number }>(
      `/api/products/${id}/stock`,
      sendJson("PATCH", { delta }, `ปรับสต็อก ${delta > 0 ? "+" : ""}${delta} (สินค้า #${id})`)
    ),

  createSale: (sale: SaleRequest) =>
    request<SaleResult>(
      "/api/sales",
      sendJson<SaleResult>("POST", sale, (data) =>
        data ? `ชำระเงิน (บิล #${data.sale_id})` : "ชำระเงิน"
      )
    ),
};
