import workflowConfig from '../config/workflow.json';
import type { TransitionDef, ClaimState } from '../types';

const config = workflowConfig as { states: ClaimState[]; transitions: TransitionDef[] };

const STATE_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  DOCUMENTS_VERIFIED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  UNDER_ASSESSMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_INFO: 'bg-orange-100 text-orange-800 border-orange-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  PAYMENT_INITIATED: 'bg-purple-100 text-purple-800 border-purple-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function WorkflowExplorer() {
  return (
    <div className="space-y-4">
      {/* States */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">{config.states.length} States</h2>
        <div className="flex flex-wrap gap-2">
          {config.states.map((s) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATE_COLOR[s] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Transitions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">{config.transitions.length} Transitions</h2>
        <div className="space-y-3">
          {config.transitions.map((t, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATE_COLOR[t.from] ?? 'bg-gray-100'}`}>{t.from}</span>
                <span className="text-gray-400 text-sm">→</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATE_COLOR[t.to] ?? 'bg-gray-100'}`}>{t.to}</span>
                {t.label && <span className="text-xs text-gray-500 italic">{t.label}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {t.authorized_roles.map((r) => (
                      <span key={r} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{r}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Preconditions</p>
                  {t.preconditions.length === 0 ? (
                    <span className="text-gray-400 italic">none</span>
                  ) : (
                    <div className="space-y-0.5">
                      {t.preconditions.map((p, j) => (
                        <div key={j} className="text-gray-600">
                          {p.type === 'any_of'
                            ? `any_of: [${(p.any_of ?? []).map((s) => s.type).join(' | ')}]`
                            : p.type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Side Effects</p>
                  {t.side_effects.length === 0 ? (
                    <span className="text-gray-400 italic">none</span>
                  ) : (
                    <div className="space-y-0.5">
                      {t.side_effects.map((e, j) => (
                        <div key={j} className="text-gray-600">{e.type}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
