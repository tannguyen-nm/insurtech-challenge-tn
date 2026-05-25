import type { Policy } from '../types/policy';

interface Props { policy: Policy; }

export default function MemberBreakdown({ policy }: Props) {
  if (!policy.members) return null;
  const m = policy.members;
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Member Breakdown</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: m.total },
          { label: 'Employees', value: m.employee },
          ...(m.dependent_spouse !== undefined ? [{ label: 'Spouses', value: m.dependent_spouse }] : []),
          ...(m.dependent_child !== undefined ? [{ label: 'Children', value: m.dependent_child }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
