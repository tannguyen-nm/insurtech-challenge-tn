import { useMemo } from 'react'
import type { Claim, Filters } from '../types'

function toTimestamp(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getTime()
}

export function useFilteredData(data: Claim[], filters: Filters, selectedDiagnosis: string | null) {
  return useMemo(() => {
    const from = filters.dateFrom ? toTimestamp(filters.dateFrom) : null
    const to = filters.dateTo ? toTimestamp(filters.dateTo) : null

    return data.filter(c => {
      if (from !== null || to !== null) {
        const claimTs = toTimestamp(String(c.submitted_date))
        if (isNaN(claimTs)) return true
        if (from !== null && claimTs < from) return false
        if (to !== null && claimTs > to) return false
      }
      if (filters.claimTypes.length && !filters.claimTypes.includes(c.claim_type)) return false
      if (filters.insurers.length && !filters.insurers.includes(c.insurer)) return false
      if (filters.countries.length && !filters.countries.includes(c.country)) return false
      if (filters.statuses.length && !filters.statuses.includes(c.status)) return false
      if (selectedDiagnosis && c.diagnosis_icd10 !== selectedDiagnosis) return false
      return true
    })
  }, [data, filters, selectedDiagnosis])
}
