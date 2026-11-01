import { NextResponse } from "next/server";

export const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/** Body as JSON, or null when it isn't valid JSON */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** Route `[id]` segment as a positive integer, or null */
export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
