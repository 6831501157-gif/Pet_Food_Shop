import { NextResponse } from "next/server";
import { isMissingReferenceError } from "@/lib/db";
import { parseProductInput } from "@/lib/products";
import { jsonError, readJson } from "@/server/http";
import { createProduct, listProducts } from "@/server/products";
import { withSqlLog } from "@/server/sql-log";

export async function GET() {
  return NextResponse.json(await listProducts());
}

export const POST = withSqlLog(async (req: Request) => {
  const input = parseProductInput(await readJson(req));
  if (!input.ok) return jsonError(input.error, 400);

  try {
    const product_id = await createProduct(input.value);
    return NextResponse.json({ product_id }, { status: 201 });
  } catch (error) {
    if (isMissingReferenceError(error)) return jsonError("ไม่พบหมวดหมู่ที่เลือก", 400);
    throw error;
  }
});
