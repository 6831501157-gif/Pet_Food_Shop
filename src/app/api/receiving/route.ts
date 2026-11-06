import { NextResponse } from "next/server";
import { isMissingReferenceError } from "@/lib/db";
import { validateReceipt, type ReceiptInput } from "@/lib/receiving";
import { jsonError, readJson } from "@/server/http";
import { listReceipts, listSuppliers, receiveStock } from "@/server/receiving";
import { withSqlLog } from "@/server/sql-log";

export const GET = withSqlLog(async () => NextResponse.json({
  receipts: await listReceipts(), suppliers: await listSuppliers(),
}));

export const POST = withSqlLog(async (req: Request) => {
  const input = await readJson(req);
  const error = validateReceipt(input);
  if (error) return jsonError(error, 400);
  try {
    return NextResponse.json({ purchase_id: await receiveStock(input as ReceiptInput) }, { status: 201 });
  } catch (error) {
    if (isMissingReferenceError(error)) return jsonError("ไม่พบสินค้าหรือผู้จำหน่ายที่เลือก กรุณาโหลดข้อมูลใหม่", 400);
    throw error;
  }
});
