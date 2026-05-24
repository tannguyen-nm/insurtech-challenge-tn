import type { Policy } from '../types';

interface Props {
  policy: Policy;
}

const BENEFIT_COLORS: Record<string, string> = {
  INPATIENT: 'bg-blue-50 border-blue-200',
  OUTPATIENT: 'bg-green-50 border-green-200',
  DENTAL: 'bg-purple-50 border-purple-200',
  MATERNITY: 'bg-pink-50 border-pink-200',
};

export default function PolicyCard({ policy }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Policy Details</h2>
          <p className="text-sm text-gray-500">{policy.policy_number}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{policy.effective_date} → {policy.expiry_date}</p>
          <p className="font-semibold text-amber-600">Deductible: {policy.deductible.toLocaleString()} {policy.currency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {policy.benefits.map((b) => (
          <div key={b.type} className={`rounded-xl border p-3 ${BENEFIT_COLORS[b.type] ?? 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-sm text-gray-800">{b.type}</span>
              <span className="text-xs font-medium text-gray-600">
                {b.annual_limit.toLocaleString()} THB/yr
              </span>
            </div>
            {b.copay_percentage > 0 && (
              <p className="text-xs text-gray-500">
                Copay: {b.copay_percentage}%{b.copay_max_per_visit ? ` (max ${b.copay_max_per_visit} THB/visit)` : ''}
              </p>
            )}
            {b.waiting_period_days && (
              <p className="text-xs text-orange-600">Waiting: {b.waiting_period_days} days</p>
            )}
            <div className="mt-1 space-y-0.5">
              {b.sub_benefits.map((s) => (
                <p key={s.name} className="text-xs text-gray-500">
                  · {s.name}
                  {s.limit_per_visit ? ` — ${s.limit_per_visit.toLocaleString()}/visit` : ''}
                  {s.limit_per_event ? ` — ${s.limit_per_event.toLocaleString()}/event` : ''}
                  {s.limit_per_day ? ` — ${s.limit_per_day.toLocaleString()}/day` : ''}
                  {s.limit_per_year ? ` — ${s.limit_per_year.toLocaleString()}/year` : ''}
                  {s.visits_per_year ? `, ${s.visits_per_year} visits/yr` : ''}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Exclusions</p>
        <div className="flex flex-wrap gap-2">
          {policy.exclusions.map((e) => (
            <span key={e} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-0.5">
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
