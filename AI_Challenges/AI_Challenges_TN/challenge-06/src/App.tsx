import { useMemo } from 'react';
import { calculateCoverage } from './lib/calculator';
import { demoPolicy } from './data/policy';
import { demoExpenses } from './data/expenses';
import PolicyCard from './components/PolicyCard';
import ExpenseResults from './components/ExpenseResults';
import BenefitSummaryPanel from './components/BenefitSummary';

export default function App() {
  const output = useMemo(() => calculateCoverage(demoPolicy, demoExpenses), []);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-2xl font-bold text-blue-700">Papaya Insurance</p>
            <p className="text-sm text-gray-500">Policy Benefits Calculator</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Challenge 06</p>
            <p>{demoExpenses.length} expenses processed</p>
          </div>
        </div>

        <PolicyCard policy={demoPolicy} />
        <BenefitSummaryPanel output={output} />
        <ExpenseResults results={output.results} expenses={demoExpenses} />
      </div>
    </div>
  );
}
