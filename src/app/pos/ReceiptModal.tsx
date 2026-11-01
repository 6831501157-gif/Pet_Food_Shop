import { Modal } from "@/components/Modal";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/payments";
import { lineTotal, type CartLine } from "./useCart";

export type Receipt = {
  sale_id: number;
  lines: CartLine[];
  total: number;
  payment_method: PaymentMethod;
  /** Cash handed over; only set for cash sales where it was entered */
  received?: number;
  date: Date;
};

export function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <Modal onClose={onClose} size="sm" printable dismissOnBackdrop={false}>
      <div className="text-center">
        <p className="text-sm font-medium text-emerald-700">ขายสำเร็จ</p>
        <h2 className="text-lg font-bold">ใบเสร็จ #{receipt.sale_id}</h2>
        <p className="text-xs text-stone-500">{receipt.date.toLocaleString("th-TH")}</p>
      </div>

      <ul className="my-4 space-y-1.5 border-y border-dashed border-stone-300 py-3 text-sm">
        {receipt.lines.map((line) => (
          <li key={line.product.product_id} className="flex justify-between gap-3">
            <span className="min-w-0">
              {line.product.product_name}
              <span className="text-stone-500"> × {line.quantity}</span>
            </span>
            <span className="tabular-nums">{formatBaht(lineTotal(line))}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-1 text-sm">
        <SummaryRow label="ยอดรวม" value={formatBaht(receipt.total)} bold />
        <SummaryRow label="ชำระโดย" value={PAYMENT_LABELS[receipt.payment_method]} />
        {receipt.received !== undefined && (
          <>
            <SummaryRow label="รับเงิน" value={formatBaht(receipt.received)} />
            <SummaryRow label="เงินทอน" value={formatBaht(receipt.received - receipt.total)} bold />
          </>
        )}
      </dl>

      <div className="mt-6 flex gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-lg border border-stone-300 py-2 hover:bg-stone-50"
        >
          พิมพ์
        </button>
        <button
          autoFocus
          onClick={onClose}
          className="flex-1 rounded-lg bg-emerald-700 py-2 font-medium text-white hover:bg-emerald-800"
        >
          ขายรายการถัดไป
        </button>
      </div>
    </Modal>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
