import type { BenefitSummary as BenefitSummaryType, CalculatorOutput } from '../types';

interface Props {
  output: CalculatorOutput;
}

const BENEFIT_COLORS: Record<string, { bar: string; text: string }> = {
  INPATIENT: { bar: 'bg-blue-500', text: 'text-blue-700' },
  OUTPATIENT: { bar: 'bg-green-500', text: 'text-green-700' },
  DENTAL: { bar: 'bg-purple-500', text: 'text-purple-700' },
  MATERNITY: { bar: 'bg-pink-500', text: 'text-pink-700' },
};

function LimitBar({ summary }: { summary: BenefitSummaryType }) {
  const pct = summary.annual_limit > 0 ? (summary.used / summary.annual_limit) * 100 : 0;
  const colors = BENEFIT_COLORS[summary.benefit_type] ?? { bar: 'bg-gray-400', text: 'text-gray-700' };
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-semibold ${colors.text}`}>{summary.benefit_type}</span>
        <span className="text-xs text-gray-500">
          {summary.used.toLocaleString()} / {summary.annual_limit.toLocaleString()} THB
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>Used: {summary.used.toLocaleString()}</span>
        <span>Remaining: {summary.remaining.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function BenefitSummary({ output }: Props) {
  const { summary, total_submitted, total_covered, total_member_pays } = output;
  const coverageRate = total_submitted > 0 ? ((total_covered / total_submitted) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Totals */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Submitted</span>
            <span className="text-sm font-semibold text-gray-900">{total_submitted.toLocaleString()} THB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Covered</span>
            <span className="text-sm font-semibold text-green-700">{total_covered.toLocaleString()} THB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Member Pays</span>
            <span className="text-sm font-semibold text-red-600">{total_member_pays.toLocaleString()} THB</span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-sm text-gray-600">Coverage Rate</span>
            <span className="text-sm font-bold text-blue-700">{coverageRate}%</span>
          </div>
        </div>
      </div>

      {/* Benefit limits */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Remaining Limits</h3>
        {summary.map((s) => (
          <LimitBar key={s.benefit_type} summary={s} />
        ))}
      </div>
    </div>
  );
}
