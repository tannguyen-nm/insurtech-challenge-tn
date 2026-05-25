import { useState } from 'react';
import ValidateTab from './components/ValidateTab';
import RulesTab from './components/RulesTab';
import DiffTab from './components/DiffTab';

const TABS = [
  { id: 'validate', label: 'Validate Claims' },
  { id: 'rules', label: 'View Rules' },
  { id: 'diff', label: 'Rule Diff' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('validate');

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-2xl font-bold text-blue-700">Papaya Insurance</p>
            <p className="text-sm text-gray-500">Multi-Country Regulatory Rule Engine</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Challenge 12</p>
            <p>TH · VN · HK · SG</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 p-1 mb-6 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-sm font-semibold py-2 px-4 rounded-xl transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'validate' && <ValidateTab />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'diff' && <DiffTab />}
      </div>
    </div>
  );
}
