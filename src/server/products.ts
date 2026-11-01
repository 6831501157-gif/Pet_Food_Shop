import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { inTransaction, pool, runSql } from "@/lib/db";
import type { Product, ProductInput } from "@/lib/products";

export async function listProducts(): Promise<Product[]> {
  return runSql<(Product & RowDataPacket)[]>(
    pool,
    `SELECT p.product_id, p.category_id, c.category_name, p.product_name,
            p.sell_price, p.stock_qty, p.unit
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
      ORDER BY p.product_id`
  );
}

/** Returns the new product id */
export async function createProduct(input: ProductInput): Promise<number> {
  const result = await runSql<ResultSetHeader>(
    pool,
    `INSERT INTO products (category_id, product_name, sell_price, stock_qty, unit)
     VALUES (?, ?, ?, ?, ?)`,
    [input.category_id, input.product_name, input.sell_price, input.stock_qty, input.unit]
  );
  return result.insertId;
}

/** Returns false if the product doesn't exist */
export async function updateProduct(id: number, input: ProductInput): Promise<boolean> {
  const result = await runSql<ResultSetHeader>(
    pool,
    `UPDATE products
        SET category_id = ?, product_name = ?, sell_price = ?, stock_qty = ?, unit = ?
      WHERE product_id = ?`,
    [input.category_id, input.product_name, input.sell_price, input.stock_qty, input.unit, id]
  );
  return result.affectedRows > 0;
}

/** Returns false if the product doesn't exist */
export async function deleteProduct(id: number): Promise<boolean> {
  const result = await runSql<ResultSetHeader>(
    pool,
    "DELETE FROM products WHERE product_id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Adds `delta` to the current stock in the database (never below 0), so a sale
 * made in between isn't overwritten. Returns the new stock, or null if not found.
 */
export async function adjustStock(id: number, delta: number): Promise<number | null> {
  return inTransaction(async (conn) => {
    const result = await runSql<ResultSetHeader>(
      conn,
      "UPDATE products SET stock_qty = GREATEST(stock_qty + ?, 0) WHERE product_id = ?",
      [delta, id]
    );
    if (result.affectedRows === 0) return null;

    const rows = await runSql<RowDataPacket[]>(
      conn,
      "SELECT stock_qty FROM products WHERE product_id = ?",
      [id]
    );
    return rows[0].stock_qty as number;
  });
}
