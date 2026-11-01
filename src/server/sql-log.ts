// Collects every SQL statement a request runs, so the browser can show it.
import { AsyncLocalStorage } from "node:async_hooks";
import { NextResponse } from "next/server";
import type { SqlStatement } from "@/lib/sql-log";

// One shared instance even when dev hot reload loads this module twice (same trick
// as the db pool); otherwise the db layer and the route would use different stores.
const globalForLog = globalThis as unknown as { sqlLogStore?: AsyncLocalStorage<SqlStatement[]> };
const requestStatements = (globalForLog.sqlLogStore ??= new AsyncLocalStorage<SqlStatement[]>());

/** Called by the db layer; does nothing outside a withSqlLog handler */
export function recordStatement(statement: SqlStatement) {
  requestStatements.getStore()?.push(statement);
}

/**
 * Wraps a route handler that returns a JSON object and adds `sqlLog`
 * (the statements it ran) to the response body, including on errors.
 */
export function withSqlLog<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    const statements: SqlStatement[] = [];
    let response: Response;
    try {
      response = await requestStatements.run(statements, () => handler(...args));
    } catch (error) {
      console.error(error);
      response = NextResponse.json({ error: "เกิดข้อผิดพลาดที่ฐานข้อมูล" }, { status: 500 });
    }
    const body = await response.json();
    return NextResponse.json({ ...body, sqlLog: statements }, { status: response.status });
  };
}
