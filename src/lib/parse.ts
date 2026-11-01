// Small helpers for validating untrusted request bodies

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): ParseResult<T> => ({ ok: true, value });

export const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export const isPositiveInt = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

export const isNonNegativeInt = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;
