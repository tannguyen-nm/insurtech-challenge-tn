import { useState } from 'react';
import type { CoverageResult, Expense } from '../types';
import DecisionBadge from './DecisionBadge';

interface Props {
  results: CoverageResult[];
  expenses: Expense[];
}

export default function ExpenseResults({ results, expenses }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const expenseMap = Object.fromEntries(expenses.map((e) => [e.expense_id, e]));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Expense Results</h2>
        <p className="text-sm text-gray-500">Click any row to see details</p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Sub-Benefit</th>
              <th className="px-4 py-3 text-right">Submitted</th>
              <th className="px-4 py-3 text-right">Covered</th>
              <th className="px-4 py-3 text-right">Member Pays</th>
              <th className="px-4 py-3 text-center">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((r) => {
              const exp = expenseMap[r.expense_id];
              const isOpen = expanded === r.expense_id;
              return (
                <>
                  <tr
                    key={r.expense_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isOpen ? null : r.expense_id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.expense_id}</td>
                    <td className="px-4 py-3 text-gray-600">{exp?.date}</td>
                    <td className="px-4 py-3 text-gray-800">{r.expense_id && exp?.sub_benefit}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{r.submitted_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{r.covered_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600">{r.member_pays.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <DecisionBadge decision={r.decision} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${r.expense_id}-detail`} className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Diagnosis</p>
                            <p className="text-sm font-medium text-gray-800">{exp?.diagnosis}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Provider</p>
                            <p className="text-sm font-medium text-gray-800">{exp?.provider}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Deductible Applied</p>
                            <p className="text-sm font-medium text-amber-700">{r.deductible_applied.toLocaleString()} THB</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Copay</p>
                            <p className="text-sm font-medium text-gray-700">{r.copay_amount.toLocaleString()} THB</p>
                          </div>
                          {r.remaining_visit_limit !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500">Remaining Visits</p>
                              <p className="text-sm font-medium text-gray-700">{r.remaining_visit_limit}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Remaining Annual Limit</p>
                            <p className="text-sm font-medium text-gray-700">{r.remaining_annual_limit.toLocaleString()} THB</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-3 border border-blue-200">
                          <p className="text-xs text-gray-500 mb-1">Decision Reason</p>
                          <p className="text-sm text-gray-800">{r.reason}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {results.map((r) => {
          const exp = expenseMap[r.expense_id];
          const isOpen = expanded === r.expense_id;
          return (
            <div key={r.expense_id} className="p-4" onClick={() => setExpanded(isOpen ? null : r.expense_id)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-gray-500">{r.expense_id}</p>
                  <p className="text-sm font-semibold text-gray-800">{exp?.sub_benefit}</p>
                  <p className="text-xs text-gray-500">{exp?.date} · {exp?.provider}</p>
                </div>
                <DecisionBadge decision={r.decision} />
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="font-medium">{r.submitted_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Covered</p>
                  <p className="font-semibold text-green-700">{r.covered_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Member Pays</p>
                  <p className="font-medium text-red-600">{r.member_pays.toLocaleString()}</p>
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-gray-800">{r.reason}</p>
                  {r.deductible_applied > 0 && (
                    <p className="text-xs text-amber-700 mt-1">Deductible applied: {r.deductible_applied} THB</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
