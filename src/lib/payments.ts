// Shared by client and server, so keep this free of mysql2 imports
// The shop takes cash only
export const PAYMENT_METHODS = ["cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "เงินสด",
};

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHODS.includes(value as PaymentMethod);
