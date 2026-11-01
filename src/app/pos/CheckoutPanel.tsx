import { formatAmount, formatBaht } from "@/lib/format";

type CheckoutPanelProps = {
  total: number;
  /** Raw text of the cash-received input ("" when empty) */
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
  error: string;
  submitting: boolean;
  canCheckout: boolean;
  onCheckout: () => void;
};

export function CheckoutPanel({
  total,
  cashReceived,
  onCashReceivedChange,
  error,
  submitting,
  canCheckout,
  onCheckout,
}: CheckoutPanelProps) {
  return (
    <div className="space-y-4 border-t border-stone-200 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-stone-600">ยอดรวม</span>
        <span className="text-2xl font-bold tabular-nums">{formatBaht(total)}</span>
      </div>

      <CashInput total={total} value={cashReceived} onChange={onCashReceivedChange} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={onCheckout}
        disabled={!canCheckout}
        className="w-full rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-40"
      >
        {submitting ? "กำลังบันทึก…" : "ชำระเงิน"}
      </button>
    </div>
  );
}

const QUICK_CASH_AMOUNTS = [100, 500, 1000];

function CashInput({
  total,
  value,
  onChange,
}: {
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const received = Number(value);
  const change = received - total;
  const isShort = value !== "" && change < 0;

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">รับเงินสดมา (บาท)</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={total ? formatAmount(total) : "0.00"}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-right tabular-nums outline-none focus:border-emerald-600"
        />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_CASH_AMOUNTS.map((amount) => (
          <QuickCashButton key={amount} onClick={() => onChange(String(received + amount))}>
            +{amount}
          </QuickCashButton>
        ))}
        <QuickCashButton onClick={() => onChange(String(total))}>พอดี</QuickCashButton>
      </div>
      {value !== "" && (
        <p className={`flex justify-between text-sm ${isShort ? "text-red-600" : "text-stone-700"}`}>
          <span>{isShort ? "เงินไม่พอ ขาดอีก" : "เงินทอน"}</span>
          <span className="font-semibold tabular-nums">{formatBaht(Math.abs(change))}</span>
        </p>
      )}
    </div>
  );
}

function QuickCashButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-stone-300 px-2.5 py-1 text-xs hover:bg-stone-50"
    >
      {children}
    </button>
  );
}
