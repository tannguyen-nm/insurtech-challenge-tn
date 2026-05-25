export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { THB: '฿', VND: '₫', USD: '$', SGD: 'S$' };
  const sym = symbols[currency] ?? currency;
  return `${sym}${amount.toLocaleString('en-US')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatCopayPct(pct: number): string {
  return pct === 0 ? 'No copay' : `${pct}%`;
}

export function formatNetworkType(raw: string): string {
  const map: Record<string, string> = {
    PREFERRED_PROVIDER: 'Preferred Provider Network',
    HMO: 'Health Maintenance Organization',
    PPO: 'Preferred Provider Organization',
    OPEN: 'Open Network',
  };
  return map[raw] ?? raw;
}

export function formatSubBenefitLimit(sub: {
  limit_per_day?: number;
  limit_per_visit?: number;
  limit_per_event?: number;
  limit_per_year?: number;
  limit_per_pregnancy?: number;
  max_days?: number;
  visits_per_year?: number;
}, currency: string): string {
  const parts: string[] = [];
  if (sub.limit_per_day !== undefined)
    parts.push(`${formatCurrency(sub.limit_per_day, currency)}/day`);
  if (sub.limit_per_visit !== undefined)
    parts.push(`${formatCurrency(sub.limit_per_visit, currency)}/visit`);
  if (sub.limit_per_event !== undefined)
    parts.push(`${formatCurrency(sub.limit_per_event, currency)}/event`);
  if (sub.limit_per_year !== undefined)
    parts.push(`${formatCurrency(sub.limit_per_year, currency)}/year`);
  if (sub.limit_per_pregnancy !== undefined)
    parts.push(`${formatCurrency(sub.limit_per_pregnancy, currency)}/pregnancy`);
  if (sub.max_days !== undefined)
    parts.push(`max ${sub.max_days} days`);
  if (sub.visits_per_year !== undefined)
    parts.push(`${sub.visits_per_year} visits/year`);
  return parts.join(' · ') || '—';
}
