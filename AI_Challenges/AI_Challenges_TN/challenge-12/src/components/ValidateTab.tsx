import { useState } from 'react';
import { validateClaim } from '../lib/engine';
import { getConfig, getCountryCodes } from '../lib/loader';
import { testClaims } from '../data/claims';
import { OverallBadge, RuleBadge } from './StatusBadge';
import type { ValidationResult } from '../types';

export default function ValidateTab() {
  const [selectedClaim, setSelectedClaim] = useState(testClaims[0].claim_id);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const countryCodes = getCountryCodes();

  function run() {
    const claim = testClaims.find((c) => c.claim_id === selectedClaim);
    if (!claim) return;
    const config = getConfig(claim.country);
    if (!config) return;
    setResult(validateClaim(claim, config));
  }

  const claim = testClaims.find((c) => c.claim_id === selectedClaim);

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Select Test Claim</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {countryCodes.filter(c => c !== 'SG').map((cc) => (
            <div key={cc} className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-500">{cc}</p>
              <div className="flex gap-1">
                {testClaims.filter((c) => c.country === cc).map((c) => (
                  <button
                    key={c.claim_id}
                    onClick={() => { setSelectedClaim(c.claim_id); setResult(null); }}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      selectedClaim === c.claim_id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {c.claim_id.split('-').slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {claim && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-gray-50 rounded-xl p-4 text-sm">
            <div><p className="text-xs text-gray-400">Claim ID</p><p className="font-mono font-medium">{claim.claim_id}</p></div>
            <div><p className="text-xs text-gray-400">Type</p><p className="font-medium">{claim.claim_type}</p></div>
            <div><p className="text-xs text-gray-400">Submitted</p><p className="font-medium">{claim.submission_date}</p></div>
            <div><p className="text-xs text-gray-400">Pre-existing</p><p className="font-medium">{claim.is_pre_existing ? 'Yes' : 'No'}</p></div>
            <div><p className="text-xs text-gray-400">Documents</p><p className="font-medium text-xs">{claim.documents.join(', ')}</p></div>
            <div><p className="text-xs text-gray-400">Processing Days</p><p className="font-medium">{claim.processing_days ?? 'N/A'}</p></div>
            <div><p className="text-xs text-gray-400">Policy Start</p><p className="font-medium">{claim.policy_start_date}</p></div>
          </div>
        )}

        <button
          onClick={run}
          className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Validate Claim
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              Validation Result — {result.claim_id}
            </h2>
            <OverallBadge status={result.overall_status} />
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Country: <strong>{result.country_name}</strong> · Rules applied as of: {result.applied_date}
          </p>

          <div className="space-y-3">
            {result.rules.map((r) => (
              <div
                key={r.rule_id}
                className={`rounded-xl border p-4 ${
                  r.status === 'PASS' ? 'border-green-200 bg-green-50' :
                  r.status === 'FAIL' ? 'border-red-200 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-700">{r.rule_id}</span>
                    <span className="ml-2 text-xs text-gray-500 italic">{r.rule_type}</span>
                  </div>
                  <RuleBadge status={r.status} />
                </div>
                <p className="text-sm text-gray-800 mb-1">{r.message}</p>
                {r.remediation && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1 mt-2">
                    ⚑ {r.remediation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
