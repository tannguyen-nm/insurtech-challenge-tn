import type { Claim } from '../types'

export function calcKPIs(data: Claim[]) {
  const total = data.length
  const approved = data.filter(c => c.status === 'APPROVED').length
  const approvalRate = total ? (approved / total) * 100 : 0

  const processed = data.filter(c => c.processed_date)
  const avgProcessingTime = processed.length
    ? processed.reduce((sum, c) => {
        const diff = (new Date(c.processed_date).getTime() - new Date(c.submitted_date).getTime()) / 86400000
        return sum + diff
      }, 0) / processed.length
    : 0

  const totalApproved = data.filter(c => c.status === 'APPROVED').reduce((s, c) => s + c.approved_amount, 0)
  const avgClaimAmount = total ? data.reduce((s, c) => s + c.submitted_amount, 0) / total : 0

  return { total, approvalRate, avgProcessingTime, totalApproved, avgClaimAmount }
}

export function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
