import { NextResponse } from "next/server";
import { asRecord } from "@/lib/parse";
import { jsonError, parseId, readJson } from "@/server/http";
import { adjustStock } from "@/server/products";
import { withSqlLog } from "@/server/sql-log";

type Params = { params: Promise<{ id: string }> };

/** Body: { delta: number } — a non-zero integer added to the current stock */
export const PATCH = withSqlLog(async (req: Request, { params }: Params) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError("ไม่พบสินค้า", 404);

  const { delta } = asRecord(await readJson(req));
  if (!Number.isInteger(delta) || delta === 0)
    return jsonError("จำนวนที่ปรับต้องเป็นจำนวนเต็มที่ไม่ใช่ 0", 400);

  const stock_qty = await adjustStock(id, delta as number);
  if (stock_qty === null) return jsonError("ไม่พบสินค้า", 404);
  return NextResponse.json({ stock_qty });
});
