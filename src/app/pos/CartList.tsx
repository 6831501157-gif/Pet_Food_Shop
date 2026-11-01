import { StepperButton } from "@/components/StepperButton";
import { formatBaht } from "@/lib/format";
import { lineTotal, type CartLine } from "./useCart";

type CartListProps = {
  lines: CartLine[];
  itemCount: number;
  onClear: () => void;
  onSetQuantity: (productId: number, quantity: number) => void;
};

export function CartList({ lines, itemCount, onClear, onSetQuantity }: CartListProps) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="font-semibold">ตะกร้า ({itemCount})</h2>
        {lines.length > 0 && (
          <button onClick={onClear} className="text-sm text-red-600 hover:underline">
            ล้าง
          </button>
        )}
      </div>

      <ul className="max-h-[40vh] divide-y divide-stone-100 overflow-y-auto">
        {lines.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-stone-400">
            แตะสินค้าทางซ้ายเพื่อเพิ่มลงตะกร้า
          </li>
        ) : (
          lines.map((line) => (
            <CartItem key={line.product.product_id} line={line} onSetQuantity={onSetQuantity} />
          ))
        )}
      </ul>
    </>
  );
}

function CartItem({
  line,
  onSetQuantity,
}: {
  line: CartLine;
  onSetQuantity: CartListProps["onSetQuantity"];
}) {
  const { product, quantity } = line;
  const setQuantity = (q: number) => onSetQuantity(product.product_id, q);

  return (
    <li className="flex items-center gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.product_name}</p>
        <p className="text-xs text-stone-500 tabular-nums">
          {formatBaht(product.sell_price)} × {quantity} = {formatBaht(lineTotal(line))}
        </p>
      </div>
      <StepperButton step={-1} label="ลดจำนวน" onClick={() => setQuantity(quantity - 1)} />
      <input
        type="number"
        min={1}
        max={product.stock_qty}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        aria-label="จำนวน"
        className="w-12 rounded-md border border-stone-300 py-1 text-center text-sm tabular-nums"
      />
      <StepperButton
        step={1}
        label="เพิ่มจำนวน"
        disabled={quantity >= product.stock_qty}
        onClick={() => setQuantity(quantity + 1)}
      />
    </li>
  );
}
