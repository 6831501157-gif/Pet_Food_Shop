import mysql, { type QueryResult, type ResultSetHeader } from "mysql2/promise";
import { recordStatement } from "@/server/sql-log";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

// Reuse one pool across hot reloads in dev
export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    decimalNumbers: true,
    connectionLimit: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

type Executor = mysql.Pool | mysql.PoolConnection;

/** Values for the `?` placeholders (an array value expands to a list) */
type SqlParams = Extract<Parameters<typeof mysql.format>[1], unknown[]>;

/**
 * Runs one statement and records it for the SQL log. The logged text comes from
 * mysql2's `format`, the same function `query` uses to fill in `?` before sending,
 * so the log shows exactly what MySQL received.
 */
export async function runSql<T extends QueryResult>(
  db: Executor,
  sql: string,
  params: SqlParams = []
): Promise<T> {
  const sent = mysql.format(sql, params).replace(/\n\s*/g, " ").trim();
  try {
    const [result] = await db.query<T>(sql, params);
    recordStatement({ sql: sent, ok: true, result: describeResult(sent, result) });
    return result;
  } catch (error) {
    recordStatement({ sql: sent, ok: false, result: describeError(error) });
    throw error;
  }
}

/** Runs `work` between START TRANSACTION and COMMIT, or ROLLBACK if it throws */
export async function inTransaction<T>(
  work: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await runSql(conn, "START TRANSACTION");
    const result = await work(conn);
    await runSql(conn, "COMMIT");
    return result;
  } catch (error) {
    await runSql(conn, "ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
}

function describeResult(sql: string, result: QueryResult): string {
  if (Array.isArray(result)) return `${result.length} rows`;
  if (/^(START TRANSACTION|COMMIT|ROLLBACK)/.test(sql)) return "OK";
  const { insertId, affectedRows } = result as ResultSetHeader;
  return insertId
    ? `insertId = ${insertId} · affectedRows = ${affectedRows}`
    : `affectedRows = ${affectedRows}`;
}

function describeError(error: unknown): string {
  const { code, errno, sqlMessage } = error as { code?: string; errno?: number; sqlMessage?: string };
  return code ? `${code} (${errno}): ${sqlMessage}` : String(error);
}

// MySQL error numbers we turn into friendly responses
const ER_ROW_IS_REFERENCED = 1451;
const ER_NO_REFERENCED_ROW = 1452;

const errnoOf = (error: unknown) => (error as { errno?: number }).errno;

/** Delete blocked because another table still points at the row */
export const isRowReferencedError = (error: unknown) => errnoOf(error) === ER_ROW_IS_REFERENCED;

/** Insert/update points at a foreign key that doesn't exist */
export const isMissingReferenceError = (error: unknown) => errnoOf(error) === ER_NO_REFERENCED_ROW;
