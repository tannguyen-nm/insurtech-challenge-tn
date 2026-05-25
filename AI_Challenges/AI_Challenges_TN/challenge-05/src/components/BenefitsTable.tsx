import type { Policy, BenefitType } from '../types/policy';
import { formatCurrency, formatSubBenefitLimit } from '../utils/format';

interface Props { policy: Policy; }

const TYPE_ORDER: BenefitType[] = ['INPATIENT', 'OUTPATIENT', 'DENTAL', 'MATERNITY'];
const TYPE_LABEL: Record<BenefitType, string> = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  DENTAL: 'Dental',
  MATERNITY: 'Maternity',
};
const TYPE_COLOR: Record<BenefitType, string> = {
  INPATIENT: 'bg-blue-100 text-blue-800',
  OUTPATIENT: 'bg-green-100 text-green-800',
  DENTAL: 'bg-purple-100 text-purple-800',
  MATERNITY: 'bg-pink-100 text-pink-800',
};

export default function BenefitsTable({ policy }: Props) {
  const currency = policy.plan.currency;
  const sorted = [...policy.benefits].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Benefits Coverage</h2>
      <div className="space-y-5">
        {sorted.map((benefit) => {
          const limit = benefit.annual_limit ?? benefit.lifetime_limit;
          const limitLabel = benefit.lifetime_limit !== undefined ? 'Lifetime Limit' : 'Annual Limit';
          return (
            <div key={benefit.type} className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLOR[benefit.type]}`}>
                  {TYPE_LABEL[benefit.type]}
                </span>
                {limit !== undefined && (
                  <span className="text-sm font-semibold text-gray-700">
                    {limitLabel}: {formatCurrency(limit, currency)}
                  </span>
                )}
              </div>
              <table className="w-full">
                <tbody>
                  {benefit.sub_benefits.map((sub) => (
                    <tr key={sub.name} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 text-sm text-gray-700">{sub.name}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-gray-600 font-medium">
                        {formatSubBenefitLimit(sub, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
