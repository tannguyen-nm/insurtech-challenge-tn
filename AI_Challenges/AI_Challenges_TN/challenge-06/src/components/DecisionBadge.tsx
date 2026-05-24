import type { DecisionType } from '../types';

const CONFIG: Record<DecisionType, { label: string; className: string }> = {
  COVERED: { label: 'Covered', className: 'bg-green-100 text-green-800 border-green-200' },
  PARTIALLY_COVERED: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  DENIED_WAITING_PERIOD: { label: 'Waiting Period', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  DENIED_EXCLUSION: { label: 'Exclusion', className: 'bg-red-100 text-red-800 border-red-200' },
  DENIED_LIMIT_EXHAUSTED: { label: 'Limit Exhausted', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  DEDUCTIBLE_APPLIED: { label: 'Deductible', className: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export default function DecisionBadge({ decision }: { decision: DecisionType }) {
  const { label, className } = CONFIG[decision];
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}
