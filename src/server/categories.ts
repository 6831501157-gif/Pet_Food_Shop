import type { RowDataPacket } from "mysql2";
import { pool, runSql } from "@/lib/db";
import type { Category } from "@/lib/products";

export async function listCategories(): Promise<Category[]> {
  return runSql<(Category & RowDataPacket)[]>(
    pool,
    "SELECT category_id, category_name FROM categories ORDER BY category_id"
  );
}
