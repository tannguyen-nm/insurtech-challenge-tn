import { useState } from 'react';
import { WorkflowEngine } from '../lib/engine';
import type { Actor, AuditEntry, Claim, ClaimState, TransitionDef, WorkflowConfig } from '../types';
import workflowConfig from '../config/workflow.json';

const engine = new WorkflowEngine(workflowConfig as WorkflowConfig);

const ROLES = ['document_clerk', 'team_lead', 'assessor', 'finance', 'system'];

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

function makeFreshClaim(id: string): Claim {
  return {
    claim_id: id,
    current_state: 'SUBMITTED',
    documents: [
      { name: 'medical_receipt', status: 'COMPLETE' },
      { name: 'prescription', status: 'COMPLETE' },
    ],
    requested_amount: 5000,
    policy_annual_limit: 50000,
    pending_info_cycle_count: 0,
  };
}

interface TransitionLog {
  from: ClaimState;
  to: ClaimState;
  actor: Actor;
  status: 'ok' | 'error';
  message: string;
}

let claimCounter = 0;

export default function ClaimSimulator() {
  const [claim, setClaim] = useState<Claim>(() => makeFreshClaim(`CLM-SIM-${String(++claimCounter).padStart(3, '0')}`));
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [log, setLog] = useState<TransitionLog[]>([]);
  const [selectedRole, setSelectedRole] = useState('document_clerk');
  const [userId, setUserId] = useState('U001');
  const [notes, setNotes] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  // Precondition data inputs
  const [assignedAssessor, setAssignedAssessor] = useState('ASS-001');
  const [assessmentReport, setAssessmentReport] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [missingInfoDesc, setMissingInfoDesc] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [appealAcknowledged, setAppealAcknowledged] = useState(false);
  const [appealExpired, setAppealExpired] = useState(false);

  const validTransitions: TransitionDef[] = engine.getValidTransitions(claim);

  function applyClaimData(c: Claim) {
    if (assignedAssessor) c.assigned_assessor_id = assignedAssessor;
    if (assessmentReport) c.assessment_report = assessmentReport;
    if (approvedAmount) c.approved_amount = Number(approvedAmount);
    if (rejectionReason) c.rejection_reason = rejectionReason;
    if (missingInfoDesc) c.missing_info_description = missingInfoDesc;
    if (paymentRef) c.payment_reference = paymentRef;
    c.appeal_acknowledged = appealAcknowledged;
    c.appeal_period_expired = appealExpired;
  }

  function doTransition(toState: ClaimState) {
    const actor: Actor = { user_id: userId, role: selectedRole };
    const claimCopy = { ...claim, documents: [...claim.documents] };
    applyClaimData(claimCopy);

    try {
      engine.transition(claimCopy, toState, actor, notes || undefined);
      setClaim(claimCopy);
      setAuditTrail(engine.getAuditTrail(claimCopy.claim_id));
      setLog((prev) => [...prev, { from: claim.current_state, to: toState, actor, status: 'ok', message: `→ ${toState}` }]);
      setLastError(null);
      setNotes('');
    } catch (err: unknown) {
      const e = err as Error;
      setLog((prev) => [...prev, { from: claim.current_state, to: toState, actor, status: 'error', message: e.message }]);
      setLastError(e.message);
    }
  }

  function reset() {
    claimCounter++;
    const fresh = makeFreshClaim(`CLM-SIM-${String(claimCounter).padStart(3, '0')}`);
    setClaim(fresh);
    setAuditTrail([]);
    setLog([]);
    setLastError(null);
    setNotes('');
    setAssessmentReport('');
    setApprovedAmount('');
    setRejectionReason('');
    setMissingInfoDesc('');
    setPaymentRef('');
    setAppealAcknowledged(false);
    setAppealExpired(false);
  }

  const isTerminal = validTransitions.length === 0;

  return (
    <div className="space-y-4">
      {/* Claim status bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Claim ID</p>
          <p className="text-sm font-mono font-semibold text-gray-800">{claim.claim_id}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Current State</p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATE_COLOR[claim.current_state] ?? 'bg-gray-100'}`}>
            {claim.current_state}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Info Request Cycles</p>
          <p className="text-sm font-semibold text-gray-800">{claim.pending_info_cycle_count} / 3</p>
        </div>
        <button
          onClick={reset}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Reset Claim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Actor + claim data inputs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Actor</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">User ID</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Role</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              placeholder="Transition notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <h2 className="text-sm font-bold text-gray-900 pt-1">Claim Data (preconditions)</h2>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assessor ID</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={assignedAssessor} onChange={(e) => setAssignedAssessor(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Approved Amount</label>
                <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder="e.g. 5000" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Payment Reference</label>
                <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder="PAY-REF-..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assessment Report</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder="Report text..." value={assessmentReport} onChange={(e) => setAssessmentReport(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Rejection Reason</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder="Reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Missing Info Description</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder="What's missing..." value={missingInfoDesc} onChange={(e) => setMissingInfoDesc(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={appealAcknowledged} onChange={(e) => setAppealAcknowledged(e.target.checked)} />
                Member acknowledged rejection
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={appealExpired} onChange={(e) => setAppealExpired(e.target.checked)} />
                Appeal period expired
              </label>
            </div>
          </div>
        </div>

        {/* Transitions panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Valid Transitions from {claim.current_state}</h2>

          {isTerminal ? (
            <p className="text-sm text-gray-400 italic">{claim.current_state === 'CLOSED' ? 'Claim is closed.' : 'No further transitions available.'}</p>
          ) : (
            <div className="space-y-2">
              {validTransitions.map((t) => (
                <div key={t.to} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATE_COLOR[t.to] ?? 'bg-gray-100'}`}>{t.to}</span>
                      {t.label && <span className="text-xs text-gray-500 italic">{t.label}</span>}
                    </div>
                    <button
                      onClick={() => doTransition(t.to)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Advance
                    </button>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Roles: {t.authorized_roles.join(', ')}</span>
                    {t.preconditions.length > 0 && (
                      <span>· Preconditions: {t.preconditions.map((p) => p.type === 'any_of' ? `any_of[${(p.any_of ?? []).map((s) => s.type).join('|')}]` : p.type).join(', ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {lastError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {lastError}
            </div>
          )}

          {/* Transition log */}
          {log.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transition Log</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <div key={i} className={`text-xs rounded-lg px-2.5 py-1.5 ${entry.status === 'ok' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`shrink-0 font-bold ${entry.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{entry.status === 'ok' ? 'OK' : 'ERR'}</span>
                      <span className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded font-medium ${STATE_COLOR[entry.from] ?? 'bg-gray-100'}`}>{entry.from}</span>
                      <span className="shrink-0 text-gray-400">→</span>
                      <span className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded font-medium ${STATE_COLOR[entry.to] ?? 'bg-gray-100'}`}>{entry.to}</span>
                      <span className="text-gray-500">by {entry.actor.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit trail */}
      {auditTrail.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Audit Trail — {claim.claim_id}</h2>
          <div className="space-y-1.5">
            {auditTrail.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="shrink-0 font-mono text-gray-400">{entry.id}</span>
                  <span className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded font-medium border ${STATE_COLOR[entry.from_state] ?? 'bg-gray-100'}`}>{entry.from_state}</span>
                  <span className="shrink-0 text-gray-400">→</span>
                  <span className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded font-medium border ${STATE_COLOR[entry.to_state] ?? 'bg-gray-100'}`}>{entry.to_state}</span>
                  <span className="text-gray-500">by {entry.triggered_by.role} ({entry.triggered_by.user_id})</span>
                  <span className="shrink-0 text-gray-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                {entry.notes && <p className="text-gray-500 italic mt-1 ml-1">{entry.notes}</p>}
                {entry.side_effects_executed.length > 0 && (
                  <div className="mt-1.5 ml-1 space-y-0.5">
                    {entry.side_effects_executed.map((fx, i) => (
                      <p key={i} className="text-gray-400 font-mono text-[11px]">{fx}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
