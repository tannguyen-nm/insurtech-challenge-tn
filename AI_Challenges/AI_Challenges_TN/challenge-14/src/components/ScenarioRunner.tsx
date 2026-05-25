import { useState } from 'react';
import { WorkflowEngine } from '../lib/engine';
import { SCENARIOS } from '../data/scenarios';
import type { AuditEntry, Claim } from '../types';
import workflowConfig from '../config/workflow.json';

interface StepResult {
  step: number;
  description: string;
  actor: string;
  toState: string;
  status: 'PASS' | 'FAIL' | 'EXPECTED_FAIL';
  message: string;
  claimState?: string;
}

interface ScenarioResult {
  id: string;
  name: string;
  steps: StepResult[];
  auditTrail: AuditEntry[];
  finalState?: string;
}

const STATE_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  DOCUMENTS_VERIFIED: 'bg-cyan-100 text-cyan-800',
  UNDER_ASSESSMENT: 'bg-yellow-100 text-yellow-800',
  PENDING_INFO: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PAYMENT_INITIATED: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-700',
};

export default function ScenarioRunner() {
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function runAll() {
    setRunning(true);
    const engine = new WorkflowEngine(workflowConfig as ConstructorParameters<typeof WorkflowEngine>[0]);
    const allResults: ScenarioResult[] = [];

    for (const scenario of SCENARIOS) {
      const claim: Claim = scenario.initialClaim();
      const stepResults: StepResult[] = [];

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];

        // Apply mutations before transition
        if (step.claimMutation) step.claimMutation(claim);

        try {
          const result = engine.transition(claim, step.toState, step.actor, step.notes);
          if (step.expectError) {
            stepResults.push({
              step: i + 1,
              description: step.description,
              actor: `${step.actor.role} (${step.actor.user_id})`,
              toState: step.toState,
              status: 'FAIL',
              message: `Expected ${step.expectError} but transition succeeded`,
              claimState: result.claim.current_state,
            });
          } else {
            stepResults.push({
              step: i + 1,
              description: step.description,
              actor: `${step.actor.role} (${step.actor.user_id})`,
              toState: step.toState,
              status: 'PASS',
              message: `→ ${result.claim.current_state}`,
              claimState: result.claim.current_state,
            });
          }
        } catch (err: unknown) {
          const error = err as Error;
          if (step.expectError && error.name === step.expectError) {
            stepResults.push({
              step: i + 1,
              description: step.description,
              actor: `${step.actor.role} (${step.actor.user_id})`,
              toState: step.toState,
              status: 'EXPECTED_FAIL',
              message: error.message,
              claimState: claim.current_state,
            });
          } else {
            stepResults.push({
              step: i + 1,
              description: step.description,
              actor: `${step.actor.role} (${step.actor.user_id})`,
              toState: step.toState,
              status: 'FAIL',
              message: error.message,
              claimState: claim.current_state,
            });
          }
        }
      }

      allResults.push({
        id: scenario.id,
        name: scenario.name,
        steps: stepResults,
        auditTrail: engine.getAuditTrail(claim.claim_id),
        finalState: claim.current_state,
      });
    }

    setResults(allResults);
    setRunning(false);
  }

  const allPass = results.length > 0 && results.every((r) =>
    r.steps.every((s) => s.status === 'PASS' || s.status === 'EXPECTED_FAIL')
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">5 Test Scenarios</h2>
            <p className="text-xs text-gray-500">Happy path, rejection, info loop, invalid transition, unauthorized role</p>
          </div>
          {results.length > 0 && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${allPass ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
              {allPass ? 'ALL PASS' : 'SOME FAIL'}
            </span>
          )}
        </div>
        <button
          onClick={runAll}
          disabled={running}
          className="mt-3 bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run All Scenarios'}
        </button>
      </div>

      {results.map((r) => {
        const allStepsOk = r.steps.every((s) => s.status === 'PASS' || s.status === 'EXPECTED_FAIL');
        const isOpen = expanded === r.id;
        return (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${allStepsOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {allStepsOk ? 'PASS' : 'FAIL'}
                </span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{r.id}: {r.name}</p>
                  <p className="text-xs text-gray-500">{r.steps.length} steps · Final: {r.finalState}</p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                {/* Steps */}
                <div className="space-y-2">
                  {r.steps.map((s) => (
                    <div
                      key={s.step}
                      className={`rounded-xl border p-3 text-sm ${
                        s.status === 'PASS' ? 'border-green-200 bg-green-50' :
                        s.status === 'EXPECTED_FAIL' ? 'border-blue-200 bg-blue-50' :
                        'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          s.status === 'PASS' ? 'bg-green-200 text-green-800' :
                          s.status === 'EXPECTED_FAIL' ? 'bg-blue-200 text-blue-800' :
                          'bg-red-200 text-red-800'
                        }`}>{s.status === 'EXPECTED_FAIL' ? 'EXPECTED' : s.status}</span>
                        <div>
                          <p className="font-medium text-gray-800">{s.description}</p>
                          <p className="text-xs text-gray-500">{s.actor} → {s.toState}</p>
                          <p className={`text-xs mt-0.5 ${s.status === 'FAIL' ? 'text-red-700' : 'text-gray-600'}`}>{s.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit trail */}
                {r.auditTrail.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Audit Trail</p>
                    <div className="space-y-1.5">
                      {r.auditTrail.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <span className="font-mono text-gray-400">{entry.id}</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${STATE_COLOR[entry.from_state] ?? 'bg-gray-100'}`}>{entry.from_state}</span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${STATE_COLOR[entry.to_state] ?? 'bg-gray-100'}`}>{entry.to_state}</span>
                          <span className="text-gray-500">by {entry.triggered_by.role} ({entry.triggered_by.user_id})</span>
                          {entry.notes && <span className="text-gray-400 italic truncate">{entry.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
