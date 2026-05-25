import type { Policy } from '../types/policy';
import { formatCurrency, formatCopayPct } from '../utils/format';

interface Props { policy: Policy; }

export default function QuickReferenceCard({ policy }: Props) {
  const currency = policy.plan.currency;
  const totalAnnual = policy.benefits.reduce((sum, b) => sum + (b.annual_limit ?? b.lifetime_limit ?? 0), 0);
  const outpatientCopay = policy.copay?.outpatient;
  const inpatientCopay = policy.copay?.inpatient;
  const benefitCount = policy.benefits.length;

  return (
    <div className="bg-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-4">Quick Reference</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold">{formatCurrency(totalAnnual, currency)}</p>
          <p className="text-sm text-blue-200 mt-1">Total Coverage Limit</p>
        </div>
        <div className="text-center border-t sm:border-t-0 sm:border-l sm:border-r border-blue-500 pt-4 sm:pt-0">
          <p className="text-2xl font-bold">
            {outpatientCopay ? formatCopayPct(outpatientCopay.percentage) : '—'}
            {inpatientCopay && inpatientCopay.percentage !== outpatientCopay?.percentage && (
              <span className="text-lg text-blue-200"> / {formatCopayPct(inpatientCopay.percentage)}</span>
            )}
          </p>
          <p className="text-sm text-blue-200 mt-1">Copay (Outpatient / Inpatient)</p>
        </div>
        <div className="text-center border-t sm:border-t-0 pt-4 sm:pt-0">
          <p className="text-3xl font-bold">{benefitCount}</p>
          <p className="text-sm text-blue-200 mt-1">Benefit Categories</p>
        </div>
      </div>
    </div>
  );
}
