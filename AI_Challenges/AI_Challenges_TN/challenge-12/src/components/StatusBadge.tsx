import type { OverallStatus, RuleStatus } from '../types';

const OVERALL: Record<OverallStatus, string> = {
  COMPLIANT: 'bg-green-100 text-green-800 border-green-200',
  NON_COMPLIANT: 'bg-red-100 text-red-800 border-red-200',
  PARTIALLY_COMPLIANT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const RULE: Record<RuleStatus, string> = {
  PASS: 'bg-green-100 text-green-700 border-green-200',
  FAIL: 'bg-red-100 text-red-700 border-red-200',
  SKIPPED: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function OverallBadge({ status }: { status: OverallStatus }) {
  return (
    <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full border ${OVERALL[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function RuleBadge({ status }: { status: RuleStatus }) {
  return (
    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded border ${RULE[status]}`}>
      {status}
    </span>
  );
}
