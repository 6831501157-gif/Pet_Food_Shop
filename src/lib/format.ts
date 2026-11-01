/** 1234.5 → "1,234.50" */
export const formatAmount = (amount: number) =>
  amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → "฿1,234.50" */
export const formatBaht = (amount: number) => `฿${formatAmount(amount)}`;
