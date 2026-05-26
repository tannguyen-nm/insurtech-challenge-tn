import { useState } from 'react';
import './index.css';
import type { Policy } from './types/policy';
import { policy1 } from './data/policy1';
import { policy2 } from './data/policy2';
import QuickReferenceCard from './components/QuickReferenceCard';
import PolicyOverview from './components/PolicyOverview';
import MemberBreakdown from './components/MemberBreakdown';
import BenefitsTable from './components/BenefitsTable';
import CopaySchedule from './components/CopaySchedule';
import WaitingPeriods from './components/WaitingPeriods';
import ExclusionsList from './components/ExclusionsList';
import NetworkInfo from './components/NetworkInfo';

const POLICIES: { label: string; policy: Policy }[] = [
  { label: 'Corporate Health Plus (Gold)', policy: policy1 },
  { label: 'Individual Essential Care (Silver)', policy: policy2 },
];

export default function App() {
  const [selected, setSelected] = useState(0);
  const { policy } = POLICIES[selected];

  return (
    <div className="min-h-screen bg-slate-100 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl px-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 no-print">
          <div>
            <p className="text-2xl font-bold text-blue-700">Papaya Insurance</p>
            <p className="text-sm text-gray-500">Policy Summary</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {POLICIES.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => window.print()}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Print / PDF
            </button>
          </div>
        </div>

        {/* Single white document card */}
        <div className="bg-white shadow-md overflow-hidden rounded-b-xl">

          {/* Print-only header */}
          <div className="hidden print:flex items-center justify-between px-6 pt-6 pb-2">
            <p className="text-2xl font-bold text-blue-700">Papaya Insurance</p>
            <p className="text-sm text-gray-500">Policy Summary — {policy.policy_number}</p>
          </div>

          <QuickReferenceCard policy={policy} />
          <PolicyOverview policy={policy} />
          <MemberBreakdown policy={policy} />
          <BenefitsTable policy={policy} />
          <CopaySchedule policy={policy} />
          <WaitingPeriods policy={policy} />
          <ExclusionsList policy={policy} />
          <NetworkInfo policy={policy} />

          <p className="text-center text-xs text-gray-400 py-4 no-print">
            Papaya Insurance · Policy Summary Generator
          </p>
        </div>

      </div>
    </div>
  );
}
