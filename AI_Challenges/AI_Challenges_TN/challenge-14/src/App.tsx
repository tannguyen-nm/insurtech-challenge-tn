import { useState } from 'react';
import ScenarioRunner from './components/ScenarioRunner';
import WorkflowExplorer from './components/WorkflowExplorer';

type Tab = 'scenarios' | 'explorer';

export default function App() {
  const [tab, setTab] = useState<Tab>('scenarios');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Claims Workflow Orchestrator</h1>
          <p className="text-sm text-gray-500 mt-0.5">State-machine engine · Preconditions · Audit trail · Role-based access</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {(['scenarios', 'explorer'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t === 'scenarios' ? 'Test Scenarios' : 'Workflow Explorer'}
            </button>
          ))}
        </div>

        {tab === 'scenarios' && <ScenarioRunner />}
        {tab === 'explorer' && <WorkflowExplorer />}
      </div>
    </div>
  );
}
