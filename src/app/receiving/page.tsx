"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Product } from "@/lib/products";
import type { Receipt, Supplier } from "@/lib/receiving";
import { sqlLog } from "@/lib/sql-log";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const displayDate = (value: string) => value ? new Date(value + "T00:00:00").toLocaleDateString("th-TH") : "ไม่ระบุ";
const field = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2";

export default function ReceivingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const [r, p] = await Promise.all([fetch("/api/receiving"), fetch("/api/products")]);
    if (!r.ok || !p.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    const data = await r.json();
    setReceipts(data.receipts); setSuppliers(data.suppliers); setProducts(await p.json());
  }
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/receiving", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier_id: Number(data.get("supplier_id")), product_id: Number(data.get("product_id")),
          quantity: Number(data.get("quantity")), cost_price: Number(data.get("cost_price")),
          received_date: data.get("received_date"), expiry_date: data.get("expiry_date") }),
      });
      const result = await res.json();
      sqlLog.add("รับสินค้าเข้า", result.sqlLog ?? [], res.ok ? undefined : result.error);
      if (!res.ok) throw new Error(result.error || "บันทึกไม่สำเร็จ");
      form.reset();
      setMessage(`บันทึกใบรับสินค้า #${result.purchase_id} และเพิ่มสต็อกแล้ว`);
      try { await load(); } catch { setError("บันทึกสำเร็จแล้ว แต่โหลดประวัติไม่สำเร็จ กรุณากดโหลดใหม่"); }
    } catch (e) { setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  const status = (date: string) => {
    if (!date) return "ไม่ระบุ";
    const now = today();
    const soon = new Date(now + "T00:00:00Z"); soon.setUTCDate(soon.getUTCDate() + 30);
    return date < now ? "หมดอายุแล้ว" : date <= soon.toISOString().slice(0, 10) ? "ใกล้หมดอายุ" : "ปกติ";
  };
  const visible = receipts.filter(r => (r.product_name + " " + r.supplier_name).toLowerCase().includes(search.toLowerCase())
    && (filter === "all" || status(r.expiry_date) === filter));

  return <main className="mx-auto max-w-7xl px-4 py-6 pb-72 sm:px-6">
    <h1 className="text-2xl font-bold">รับสินค้าเข้า</h1>
    <p className="mt-2 text-sm text-stone-600">บันทึกผู้จำหน่าย วันที่รับเข้า และวันหมดอายุแยกตามรอบรับสินค้า พร้อมเพิ่มจำนวนในสต็อก</p>
    {error && <p role="alert" className="my-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {message && <p role="status" className="my-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    <form onSubmit={save} className="my-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">บันทึกรับสินค้า</h2>
      <fieldset disabled={loading || saving} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label>ผู้จำหน่าย (Supplier)<select name="supplier_id" required className={field} defaultValue=""><option value="" disabled>เลือกผู้จำหน่าย</option>{suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></label>
        <label>สินค้า<select name="product_id" required className={field} defaultValue=""><option value="" disabled>เลือกสินค้า</option>{products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} (คงเหลือ {p.stock_qty} {p.unit})</option>)}</select></label>
        <label>วันที่รับเข้า<input name="received_date" type="date" required defaultValue={today()} className={field}/></label>
        <label>จำนวนที่รับ<input name="quantity" type="number" min="1" max="2147483647" step="1" required className={field}/></label>
        <label>ราคาทุนต่อหน่วย (บาท)<input name="cost_price" type="number" min="0" max="99999999.99" step="0.01" required className={field}/></label>
        <label>วันหมดอายุ<input name="expiry_date" type="date" required className={field}/></label>
      </fieldset>
      <button disabled={loading || saving || !suppliers.length || !products.length} className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white disabled:opacity-50">{saving ? "กำลังบันทึก…" : "บันทึกและเพิ่มสต็อก"}</button>
    </form>
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 p-4">
        <h2 className="mr-auto text-lg font-semibold">ประวัติรับสินค้าเข้า</h2>
        <input aria-label="ค้นหาสินค้าหรือผู้จำหน่าย" placeholder="ค้นหาสินค้า / ผู้จำหน่าย" value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2"/>
        <select aria-label="สถานะวันหมดอายุ" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2"><option value="all">ทุกสถานะ</option>{["หมดอายุแล้ว", "ใกล้หมดอายุ", "ปกติ", "ไม่ระบุ"].map(s => <option key={s}>{s}</option>)}</select>
        <button onClick={() => { setError(""); load().catch(e => setError(e.message)); }} className="text-emerald-800 underline">โหลดใหม่</button>
      </div>
      <p className="px-4 pt-3 text-xs text-stone-500">ใกล้หมดอายุ = ภายใน 30 วัน รวมวันนี้ · ประวัตินี้แสดงจำนวนที่รับเข้า ไม่ใช่ยอดคงเหลือของแต่ละล็อต</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50"><tr>{["ใบรับ", "วันที่รับเข้า", "ผู้จำหน่าย", "สินค้า", "จำนวนรับ", "ทุน/หน่วย", "วันหมดอายุ", "สถานะ"].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead>
        <tbody>{visible.map(r => <tr key={r.purchase_detail_id} className="border-b border-stone-100">
          <td className="p-3">#{r.purchase_id}</td><td className="whitespace-nowrap p-3">{displayDate(r.received_date)}</td><td className="p-3">{r.supplier_name}</td><td className="p-3">{r.product_name}</td><td className="whitespace-nowrap p-3">{r.quantity} {r.unit}</td><td className="p-3">{Number(r.cost_price).toFixed(2)}</td><td className="whitespace-nowrap p-3">{displayDate(r.expiry_date)}</td><td className={`whitespace-nowrap p-3 font-medium ${status(r.expiry_date) === "หมดอายุแล้ว" ? "text-red-700" : status(r.expiry_date) === "ใกล้หมดอายุ" ? "text-amber-700" : "text-stone-600"}`}>{status(r.expiry_date)}</td>
        </tr>)}</tbody>
      </table></div>
      {!visible.length && <p className="p-8 text-center text-stone-500">{loading ? "กำลังโหลด…" : "ไม่มีประวัติรับสินค้าตามเงื่อนไข"}</p>}
    </section>
  </main>;
}
