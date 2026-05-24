import { plans } from "../data/plans";
import type { Plan } from "../data/plans";
import { formatCurrency, formatLimit, formatCopay, formatWaitingPeriod } from "../utils/format";

// Value-for-money ratio: annual_limit / monthly_premium (cap Gold annual limit for calc)
function getRecommendedIndex(): number {
  const ratios = plans.map((p) => {
    const cappedLimit = Math.min(p.annual_limit, 3000000);
    return cappedLimit / p.monthly_premium;
  });
  return ratios.indexOf(Math.max(...ratios));
}

type RowDef = {
  label: string;
  values: (plan: Plan) => string;
  rawValues: (plan: Plan) => number;
  bestIsHighest: boolean;
};

const rows: RowDef[] = [
  {
    label: "Monthly Premium",
    values: (p) => formatCurrency(p.monthly_premium),
    rawValues: (p) => p.monthly_premium,
    bestIsHighest: false,
  },
  {
    label: "Annual Limit",
    values: (p) => formatCurrency(p.annual_limit),
    rawValues: (p) => p.annual_limit,
    bestIsHighest: true,
  },
  {
    label: "Outpatient — Limit/Visit",
    values: (p) => formatCurrency(p.benefits.outpatient.limit_per_visit),
    rawValues: (p) => p.benefits.outpatient.limit_per_visit,
    bestIsHighest: true,
  },
  {
    label: "Outpatient — Visits/Year",
    values: (p) => formatLimit(p.benefits.outpatient.visits_per_year, "visits"),
    rawValues: (p) => p.benefits.outpatient.visits_per_year === -1 ? Infinity : p.benefits.outpatient.visits_per_year,
    bestIsHighest: true,
  },
  {
    label: "Inpatient — Limit/Day",
    values: (p) => formatCurrency(p.benefits.inpatient.limit_per_day),
    rawValues: (p) => p.benefits.inpatient.limit_per_day,
    bestIsHighest: true,
  },
  {
    label: "Inpatient — Days/Year",
    values: (p) => formatLimit(p.benefits.inpatient.days_per_year, "days"),
    rawValues: (p) => p.benefits.inpatient.days_per_year === -1 ? Infinity : p.benefits.inpatient.days_per_year,
    bestIsHighest: true,
  },
  {
    label: "Dental Coverage",
    values: (p) => p.benefits.dental ? formatCurrency(p.benefits.dental.limit_per_year) + "/year" : "Not included",
    rawValues: (p) => p.benefits.dental ? p.benefits.dental.limit_per_year : -Infinity,
    bestIsHighest: true,
  },
  {
    label: "Maternity Coverage",
    values: (p) => p.benefits.maternity ? formatCurrency(p.benefits.maternity.limit_per_pregnancy) + "/pregnancy" : "Not included",
    rawValues: (p) => p.benefits.maternity ? p.benefits.maternity.limit_per_pregnancy : -Infinity,
    bestIsHighest: true,
  },
  {
    label: "Copay",
    values: (p) => formatCopay(p.copay_percentage),
    rawValues: (p) => p.copay_percentage,
    bestIsHighest: false,
  },
  {
    label: "Waiting Period",
    values: (p) => formatWaitingPeriod(p.waiting_period_days),
    rawValues: (p) => p.waiting_period_days,
    bestIsHighest: false,
  },
];

function getBestIndex(row: RowDef): number {
  const rawVals = plans.map(row.rawValues);
  const best = row.bestIsHighest ? Math.max(...rawVals) : Math.min(...rawVals);
  return rawVals.indexOf(best);
}

const planColors = [
  { header: "bg-amber-700", badge: "bg-amber-100 text-amber-800", highlight: "bg-amber-50 font-semibold text-amber-900" },
  { header: "bg-slate-500", badge: "bg-slate-100 text-slate-800", highlight: "bg-slate-50 font-semibold text-slate-900" },
  { header: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800", highlight: "bg-yellow-50 font-semibold text-yellow-900" },
];

export default function ComparisonTable() {
  const recommendedIdx = getRecommendedIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Insurance Plan Comparison</h1>
        <p className="text-gray-500 text-center mb-10">Choose the plan that fits your needs and budget</p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-2xl shadow-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr>
                <th className="bg-gray-100 px-6 py-4 text-left text-sm font-semibold text-gray-600 w-48">Coverage</th>
                {plans.map((plan, i) => (
                  <th key={plan.name} className={`${planColors[i].header} px-6 py-5 text-center text-white align-top`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold px-3 py-0.5 rounded-full mb-1 ${i === recommendedIdx ? "bg-white text-gray-800" : "invisible"}`}>
                        ★ Recommended
                      </span>
                      <span className="text-xl font-bold">{plan.name}</span>
                      <span className="text-2xl font-extrabold">${plan.monthly_premium}<span className="text-sm font-normal">/mo</span></span>
                      <div className="flex flex-col gap-0.5 mt-2">
                        {plan.highlights.map((h) => (
                          <span key={h} className="text-xs opacity-90">{h}</span>
                        ))}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const bestIdx = getBestIndex(row);
                return (
                  <tr key={row.label} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-700">{row.label}</td>
                    {plans.map((plan, colIdx) => {
                      const isBest = colIdx === bestIdx;
                      return (
                        <td
                          key={plan.name}
                          className={`px-6 py-3 text-center text-sm ${isBest ? planColors[colIdx].highlight : "text-gray-700"}`}
                        >
                          {isBest && <span className="mr-1 text-xs">✓</span>}
                          {row.values(plan)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-6">
          {plans.map((plan, i) => (
            <div key={plan.name} className="rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className={`${planColors[i].header} px-6 py-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold">{plan.name}</p>
                    <p className="text-2xl font-extrabold">${plan.monthly_premium}<span className="text-sm font-normal">/mo</span></p>
                  </div>
                  {i === recommendedIdx && (
                    <span className="bg-white text-xs font-bold px-3 py-1 rounded-full text-gray-800">★ Recommended</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {plan.highlights.map((h) => (
                    <span key={h} className="text-xs opacity-90 bg-black/20 rounded px-2 py-0.5">{h}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white divide-y divide-gray-100">
                {rows.map((row) => {
                  const bestIdx = getBestIndex(row);
                  const isBest = i === bestIdx;
                  return (
                    <div key={row.label} className={`flex justify-between px-5 py-3 text-sm ${isBest ? planColors[i].highlight : ""}`}>
                      <span className="text-gray-600 font-medium">{row.label}</span>
                      <span className={isBest ? "font-semibold" : "text-gray-800"}>
                        {isBest && <span className="mr-1 text-xs">✓</span>}
                        {row.values(plan)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-gray-400 mt-8 flex flex-col items-center gap-1">
          <span>✓ = Best value in category</span>
          <span>★ = Recommended by value-for-money ratio</span>
        </div>
      </div>
    </div>
  );
}
