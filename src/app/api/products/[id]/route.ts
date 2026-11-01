import { NextResponse } from "next/server";
import { isMissingReferenceError, isRowReferencedError } from "@/lib/db";
import { parseProductInput } from "@/lib/products";
import { jsonError, parseId, readJson } from "@/server/http";
import { deleteProduct, updateProduct } from "@/server/products";
import { withSqlLog } from "@/server/sql-log";

type Params = { params: Promise<{ id: string }> };

const NOT_FOUND = "ไม่พบสินค้า";

export const PUT = withSqlLog(async (req: Request, { params }: Params) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError(NOT_FOUND, 404);

  const input = parseProductInput(await readJson(req));
  if (!input.ok) return jsonError(input.error, 400);

  try {
    const updated = await updateProduct(id, input.value);
    return updated ? NextResponse.json({ ok: true }) : jsonError(NOT_FOUND, 404);
  } catch (error) {
    if (isMissingReferenceError(error)) return jsonError("ไม่พบหมวดหมู่ที่เลือก", 400);
    throw error;
  }
});

export const DELETE = withSqlLog(async (_req: Request, { params }: Params) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError(NOT_FOUND, 404);

  try {
    const deleted = await deleteProduct(id);
    return deleted ? NextResponse.json({ ok: true }) : jsonError(NOT_FOUND, 404);
  } catch (error) {
    if (isRowReferencedError(error))
      return jsonError("ลบไม่ได้ เพราะสินค้านี้มีอยู่ในบิลขายหรือใบสั่งซื้อแล้ว", 409);
    throw error;
  }
});
