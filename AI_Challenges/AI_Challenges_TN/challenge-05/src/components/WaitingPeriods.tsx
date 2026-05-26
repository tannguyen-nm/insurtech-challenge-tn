import type { Policy, BenefitType } from '../types/policy';

interface Props { policy: Policy; }

const TYPE_LABEL: Record<BenefitType, string> = {
  INPATIENT: 'Inpatient', OUTPATIENT: 'Outpatient', DENTAL: 'Dental', MATERNITY: 'Maternity',
};

export default function WaitingPeriods({ policy }: Props) {
  const withWaiting = policy.benefits.filter(
    (b) => b.waiting_period_days !== undefined && b.waiting_period_days > 0
  );
  if (withWaiting.length === 0) return null;

  return (
    <section className="p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Waiting Periods</h2>
      <div className="space-y-2">
        {withWaiting.map((b) => (
          <div key={b.type} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-amber-500 text-lg">⏳</span>
            <div>
              <span className="font-semibold text-amber-800">{TYPE_LABEL[b.type]}</span>
              <span className="text-amber-700 text-sm ml-2">
                — {b.waiting_period_days} day waiting period before coverage begins
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
