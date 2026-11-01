import { Modal } from "@/components/Modal";
import type { Product } from "@/lib/products";

type DeleteProductModalProps = {
  product: Product;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteProductModal({ product, onCancel, onConfirm }: DeleteProductModalProps) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="text-lg font-semibold">ลบสินค้า?</h2>
      <p className="mt-2 text-stone-600">
        ต้องการลบ <b>{product.product_name}</b> (รหัส {product.product_id}) ใช่ไหม
        การลบย้อนกลับไม่ได้
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-100">
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          ลบสินค้า
        </button>
      </div>
    </Modal>
  );
}
