import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { inTransaction, pool, runSql } from "@/lib/db";
import type { SaleItem, SaleRequest, SaleResult } from "@/lib/sales";

/** The sale can't go through with the current stock (sent as HTTP 409) */
export class SaleError extends Error {}

type LockedProduct = RowDataPacket & {
  product_id: number;
  product_name: string;
  sell_price: number;
  stock_qty: number;
};

type PricedItem = SaleItem & { sell_price: number; subtotal: number };

export async function listRecentSales(limit = 20) {
  return runSql<RowDataPacket[]>(
    pool,
    `SELECT s.sale_id, s.sale_date, s.total_amount, s.payment_method,
            COUNT(d.sale_detail_id) AS item_count
       FROM sales s
       LEFT JOIN sale_details d ON d.sale_id = s.sale_id
      GROUP BY s.sale_id
      ORDER BY s.sale_id DESC
      LIMIT ?`,
    [limit]
  );
}

/** Records the sale and deducts stock in one transaction */
export async function createSale({ payment_method, items }: SaleRequest): Promise<SaleResult> {
  return inTransaction(async (conn) => {
    const priced = await lockAndPriceItems(conn, items);
    const total = priced.reduce((sum, item) => sum + item.subtotal, 0);

    const sale = await runSql<ResultSetHeader>(
      conn,
      "INSERT INTO sales (sale_date, total_amount, payment_method) VALUES (NOW(), ?, ?)",
      [total, payment_method]
    );
    await insertSaleDetails(conn, sale.insertId, priced);
    await deductStock(conn, priced);

    return { sale_id: sale.insertId, total_amount: total };
  });
}

// Locks the rows (FOR UPDATE) so two checkouts can't oversell the same stock.
// Prices come from the database, never from the client.
async function lockAndPriceItems(conn: PoolConnection, items: SaleItem[]): Promise<PricedItem[]> {
  const rows = await runSql<LockedProduct[]>(
    conn,
    `SELECT product_id, product_name, sell_price, stock_qty
       FROM products WHERE product_id IN (?) FOR UPDATE`,
    [items.map((item) => item.product_id)]
  );
  const productsById = new Map(rows.map((p) => [p.product_id, p]));

  return items.map((item) => {
    const product = productsById.get(item.product_id);
    if (!product) throw new SaleError(`ไม่พบสินค้ารหัส ${item.product_id}`);
    if (product.stock_qty < item.quantity)
      throw new SaleError(`"${product.product_name}" เหลือแค่ ${product.stock_qty}`);
    return {
      ...item,
      sell_price: product.sell_price,
      subtotal: product.sell_price * item.quantity,
    };
  });
}

async function insertSaleDetails(conn: PoolConnection, saleId: number, items: PricedItem[]) {
  await runSql(
    conn,
    "INSERT INTO sale_details (sale_id, product_id, quantity, sell_price, subtotal) VALUES ?",
    [items.map((i) => [saleId, i.product_id, i.quantity, i.sell_price, i.subtotal])]
  );
}

async function deductStock(conn: PoolConnection, items: PricedItem[]) {
  for (const item of items) {
    await runSql(conn, "UPDATE products SET stock_qty = stock_qty - ? WHERE product_id = ?", [
      item.quantity,
      item.product_id,
    ]);
  }
}
