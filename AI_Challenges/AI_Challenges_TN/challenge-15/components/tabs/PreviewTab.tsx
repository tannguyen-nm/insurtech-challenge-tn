'use client'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import type { TenantConfig, ProcessClaimInput, ProcessClaimResult } from '@/lib/types'
import { CLAIM_TYPES } from '@/lib/types'
import { processClaim } from '@/lib/processClaim'
import { clsx } from '@/lib/utils'

export function PreviewTab() {
  const { watch } = useFormContext<TenantConfig>()
  const config = watch()

  const enabledTypes = CLAIM_TYPES.filter(t => config.claimTypes?.[t]?.enabled)

  const [claimType, setClaimType] = useState<string>(enabledTypes[0] ?? '')
  const [amount, setAmount] = useState<string>('5000')
  const [submissionDate, setSubmissionDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [docInput, setDocInput] = useState<string>('')
  const [documents, setDocuments] = useState<string[]>([])
  const [result, setResult] = useState<ProcessClaimResult | null>(null)

  const addDoc = () => {
    const val = docInput.trim()
    if (val && !documents.includes(val)) setDocuments(d => [...d, val])
    setDocInput('')
  }

  const simulate = () => {
    if (!claimType || !amount || !submissionDate) return
    const input: ProcessClaimInput = {
      tenantId: config.tenantId,
      claimType: claimType as ProcessClaimInput['claimType'],
      amount: parseFloat(amount) || 0,
      submissionDate,
      documents,
    }
    setResult(processClaim(config, input))
  }

  const inputClass = 'px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500 mb-4">
          Simulate how this tenant config will process a claim — uses current form state, not saved data.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Claim Type</label>
            <select
              value={claimType}
              onChange={e => { setClaimType(e.target.value); setResult(null) }}
              className={`${inputClass} w-full`}
            >
              <option value="">Select...</option>
              {enabledTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {enabledTypes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No claim types enabled. Enable at least one in Claim Types tab.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Amount ($)</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={e => { setAmount(e.target.value); setResult(null) }}
              className={`${inputClass} w-full`}
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Submission Date</label>
            <input
              type="date"
              value={submissionDate}
              onChange={e => { setSubmissionDate(e.target.value); setResult(null) }}
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Documents Submitted</label>
            <div className="flex flex-wrap gap-1 min-h-[38px] p-1.5 border border-slate-200 rounded-lg bg-white">
              {documents.map((d, i) => (
                <span key={i} className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {d}
                  <button type="button" onClick={() => setDocuments(docs => docs.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500 font-bold leading-none">×</button>
                </span>
              ))}
              <input
                value={docInput}
                onChange={e => setDocInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDoc() } }}
                onBlur={addDoc}
                placeholder="Type doc name, Enter"
                className="px-1 py-0.5 text-xs outline-none bg-transparent min-w-[130px] placeholder-slate-300"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={simulate}
          disabled={!claimType || !amount || !submissionDate}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Simulate Claim
        </button>
      </div>

      {result && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {result.errors.length > 0 ? (
            <div className="p-4 bg-red-50">
              {result.errors.map((e, i) => (
                <p key={i} className="text-sm text-red-700 font-medium">{e}</p>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Approval Routing */}
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Approval Routing</p>
                {result.approvalRouting.autoApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    ✓ Auto-Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                    Tier {result.approvalRouting.tier} — {result.approvalRouting.requiredRole}
                  </span>
                )}
              </div>

              {/* Required Documents */}
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Required Documents
                  {result.missingDocuments.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs normal-case font-medium">
                      {result.missingDocuments.length} missing
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.requiredDocuments.map(doc => {
                    const missing = result.missingDocuments.includes(doc)
                    return (
                      <span
                        key={doc}
                        className={clsx(
                          'px-2 py-1 text-xs rounded-full font-medium',
                          missing
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        )}
                      >
                        {missing ? '✗ ' : '✓ '}{doc}
                      </span>
                    )
                  })}
                </div>
                {result.optionalDocuments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Optional:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.optionalDocuments.map(doc => (
                        <span key={doc} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">{doc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SLA */}
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">SLA</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-700">
                    <span className="font-semibold">{result.slaBusinessDays}</span> business days
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-800">{result.slaDeadline}</span>
                </div>
              </div>

              {/* Custom Fields */}
              {result.customFieldsRequired.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Custom Fields Required</p>
                  <div className="flex flex-wrap gap-2">
                    {result.customFieldsRequired.map(f => (
                      <span
                        key={f.name}
                        className={clsx(
                          'px-2 py-1 text-xs rounded-full font-medium border',
                          f.required
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        )}
                      >
                        {f.name}
                        {f.required && <span className="ml-1 text-orange-500">*</span>}
                        <span className="ml-1 text-slate-400 font-normal">{f.type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications */}
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {result.notifications.map(n => (
                    <div key={n.event} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 min-w-[160px]">{n.event.replace(/_/g, ' ')}</span>
                      <div className="flex gap-1">
                        {n.channels.map(ch => (
                          <span key={ch} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{ch}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
