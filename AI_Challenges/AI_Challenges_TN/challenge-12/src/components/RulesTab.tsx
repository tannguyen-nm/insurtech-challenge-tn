import { useState } from 'react';
import { getAllConfigs, getCountryCodes } from '../lib/loader';

const TYPE_COLORS: Record<string, string> = {
  document_requirement: 'bg-blue-100 text-blue-700 border-blue-200',
  sla_check: 'bg-purple-100 text-purple-700 border-purple-200',
  waiting_period: 'bg-orange-100 text-orange-700 border-orange-200',
  data_masking: 'bg-pink-100 text-pink-700 border-pink-200',
  coverage_mandate: 'bg-green-100 text-green-700 border-green-200',
};

export default function RulesTab() {
  const codes = getCountryCodes();
  const [selected, setSelected] = useState(codes[0] ?? 'TH');
  const configs = getAllConfigs();
  const config = configs.find((c) => c.country === selected);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {codes.map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
              selected === c
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {config && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{config.country_name} Rules</h2>
            <p className="text-xs text-gray-500">{config.rules.length} rules · Effective from {config.effective_date}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {config.rules.map((rule) => (
              <div key={rule.rule_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-800">{rule.rule_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[rule.rule_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {rule.rule_type.replace(/_/g, ' ')}
                    </span>
                    {rule.always_pass && (
                      <span className="text-xs px-2 py-0.5 rounded border bg-green-50 text-green-600 border-green-200">always pass</span>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                    from {rule.effective_date}
                    {rule.expiry_date && <> → {rule.expiry_date}</>}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rule.description}</p>
                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto text-gray-600 border border-gray-100">
                  {JSON.stringify(rule.parameters, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
