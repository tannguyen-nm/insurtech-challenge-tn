export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatLimit(value: number, unit?: string): string {
  if (value === -1) return "Unlimited";
  return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
}

export function formatCopay(value: number): string {
  if (value === 0) return "No copay";
  return `${value}%`;
}

export function formatWaitingPeriod(days: number): string {
  if (days === 0) return "No waiting period";
  return `${days} days`;
}
