import type { Policy } from '../types/policy';
import { formatCopayPct, formatCurrency } from '../utils/format';

interface Props { policy: Policy; }

export default function CopaySchedule({ policy }: Props) {
  if (!policy.copay) return null;
  const { copay, plan } = policy;
  const entries = [
    { label: 'Inpatient', entry: copay.inpatient },
    { label: 'Outpatient', entry: copay.outpatient },
    { label: 'Dental', entry: copay.dental },
    { label: 'Maternity', entry: copay.maternity },
  ].filter((e) => e.entry !== undefined);

  return (
    <section className="p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Copay Schedule</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="pb-2 font-medium">Benefit Type</th>
            <th className="pb-2 font-medium text-center">Copay Rate</th>
            <th className="pb-2 font-medium text-right">Max per Visit</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ label, entry }) => (
            <tr key={label} className="border-b border-gray-50 last:border-0">
              <td className="py-2.5 text-gray-700">{label}</td>
              <td className="py-2.5 text-center font-semibold text-gray-900">
                {formatCopayPct(entry!.percentage)}
              </td>
              <td className="py-2.5 text-right text-gray-600">
                {entry!.max_per_visit !== undefined
                  ? formatCurrency(entry!.max_per_visit, plan.currency)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
