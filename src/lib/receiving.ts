export type Supplier = { supplier_id: number; supplier_name: string };
export type ReceiptInput = {
  supplier_id: number; product_id: number; quantity: number; cost_price: number;
  received_date: string; expiry_date: string;
};
export type Receipt = ReceiptInput & {
  purchase_detail_id: number; purchase_id: number; supplier_name: string; product_name: string; unit: string;
};

export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && value >= "1000-01-01" && value <= "9999-12-31"
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validateReceipt(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "ข้อมูลไม่ถูกต้อง";
  const r = raw as ReceiptInput;
  if (![r.supplier_id, r.product_id].every(v => Number.isInteger(v) && v > 0)) return "กรุณาเลือกผู้จำหน่ายและสินค้า";
  if (!Number.isInteger(r.quantity) || r.quantity <= 0 || r.quantity > 2147483647) return "จำนวนต้องเป็นจำนวนเต็มมากกว่า 0";
  if (!Number.isFinite(r.cost_price) || r.cost_price < 0 || Math.abs(r.cost_price * 100 - Math.round(r.cost_price * 100)) > 0.00001 || r.cost_price * r.quantity > 99999999.99) return "ราคาทุนไม่ถูกต้อง หรือยอดรวมเกินขีดจำกัด";
  if (!validDate(r.received_date) || !validDate(r.expiry_date)) return "กรุณาระบุวันที่รับเข้าและวันหมดอายุให้ถูกต้อง";
  if (r.expiry_date < r.received_date) return "วันหมดอายุต้องไม่ก่อนวันที่รับเข้า";
  return null;
}
