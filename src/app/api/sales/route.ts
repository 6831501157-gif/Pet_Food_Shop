import { NextResponse } from "next/server";
import { parseSaleRequest } from "@/lib/sales";
import { jsonError, readJson } from "@/server/http";
import { createSale, listRecentSales, SaleError } from "@/server/sales";
import { withSqlLog } from "@/server/sql-log";

export async function GET() {
  return NextResponse.json(await listRecentSales());
}

export const POST = withSqlLog(async (req: Request) => {
  const sale = parseSaleRequest(await readJson(req));
  if (!sale.ok) return jsonError(sale.error, 400);

  try {
    return NextResponse.json(await createSale(sale.value), { status: 201 });
  } catch (error) {
    if (error instanceof SaleError) return jsonError(error.message, 409);
    throw error;
  }
});
