import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool, runSql, inTransaction } from "@/lib/db";
import type { ReceiptInput, Receipt, Supplier } from "@/lib/receiving";

export function listSuppliers() {
  return runSql<(Supplier & RowDataPacket)[]>(pool, "SELECT supplier_id, supplier_name FROM suppliers ORDER BY supplier_name");
}

export function listReceipts() {
  return runSql<(Receipt & RowDataPacket)[]>(pool, `SELECT d.purchase_detail_id, d.purchase_id,
    p.supplier_id, s.supplier_name, d.product_id, pr.product_name, pr.unit, d.quantity, d.cost_price,
    DATE_FORMAT(p.purchase_date, '%Y-%m-%d') AS received_date,
    DATE_FORMAT(d.expiry_date, '%Y-%m-%d') AS expiry_date
    FROM purchase_details d JOIN purchases p ON p.purchase_id = d.purchase_id
    JOIN suppliers s ON s.supplier_id = p.supplier_id JOIN products pr ON pr.product_id = d.product_id
    ORDER BY p.purchase_date DESC, d.purchase_detail_id DESC`);
}

export function receiveStock(input: ReceiptInput) {
  return inTransaction(async conn => {
    const purchase = await runSql<ResultSetHeader>(conn,
      "INSERT INTO purchases (supplier_id, purchase_date, total_cost) VALUES (?, ?, ?)",
      [input.supplier_id, input.received_date, Math.round(input.quantity * input.cost_price * 100) / 100]);
    await runSql<ResultSetHeader>(conn,
      `INSERT INTO purchase_details (purchase_id, product_id, quantity, cost_price, subtotal, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [purchase.insertId, input.product_id, input.quantity, input.cost_price,
        Math.round(input.quantity * input.cost_price * 100) / 100, input.expiry_date]);
    await runSql<ResultSetHeader>(conn,
      "UPDATE products SET stock_qty = stock_qty + ? WHERE product_id = ?", [input.quantity, input.product_id]);
    return purchase.insertId;
  });
}
