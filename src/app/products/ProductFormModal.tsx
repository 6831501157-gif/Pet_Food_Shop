"use client";

import { useState } from "react";
import { Field, inputClassName } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { api, getErrorMessage } from "@/lib/api-client";
import type { Category, Product, ProductInput } from "@/lib/products";

type ProductFormModalProps = {
  /** Product to edit, or undefined to create a new one */
  product?: Product;
  /** Pre-selected category when creating */
  defaultCategoryId: number | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

// Inputs hold strings while typing; converted to numbers on submit
type FormValues = Record<keyof ProductInput, string>;

const DEFAULT_UNIT = "กระสอบ";

function initialValues(product: Product | undefined, defaultCategoryId: number | null): FormValues {
  if (product) {
    return {
      category_id: String(product.category_id),
      product_name: product.product_name,
      sell_price: String(product.sell_price),
      stock_qty: String(product.stock_qty),
      unit: product.unit,
    };
  }
  return {
    category_id: defaultCategoryId === null ? "" : String(defaultCategoryId),
    product_name: "",
    sell_price: "",
    stock_qty: "0",
    unit: DEFAULT_UNIT,
  };
}

const toProductInput = (values: FormValues): ProductInput => ({
  category_id: Number(values.category_id),
  product_name: values.product_name,
  sell_price: Number(values.sell_price),
  stock_qty: Number(values.stock_qty),
  unit: values.unit,
});

export function ProductFormModal({
  product,
  defaultCategoryId,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [values, setValues] = useState(() => initialValues(product, defaultCategoryId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = product !== undefined;

  const bind = (key: keyof FormValues) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input = toProductInput(values);
      if (isEdit) await api.updateProduct(product.product_id, input);
      else await api.createProduct(input);
      onSaved(isEdit ? "แก้ไขสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
    } catch (err) {
      setError(getErrorMessage(err, "บันทึกไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">
          {isEdit ? `แก้ไขสินค้า #${product.product_id}` : "เพิ่มสินค้าใหม่"}
        </h2>
        <Field label="ชื่อสินค้า">
          <input autoFocus required maxLength={200} {...bind("product_name")} className={inputClassName} />
        </Field>
        <Field label="หมวดหมู่">
          <select required {...bind("category_id")} className={inputClassName}>
            <option value="" disabled>
              — เลือกหมวดหมู่ —
            </option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ราคาขาย (บาท)">
            <input required type="number" min="0" step="0.01" {...bind("sell_price")} className={inputClassName} />
          </Field>
          <Field label="สต็อก">
            <input required type="number" min="0" step="1" {...bind("stock_qty")} className={inputClassName} />
          </Field>
          <Field label="หน่วย">
            <input required maxLength={30} {...bind("unit")} className={inputClassName} />
          </Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-100"
          >
            ยกเลิก
          </button>
          <button
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
