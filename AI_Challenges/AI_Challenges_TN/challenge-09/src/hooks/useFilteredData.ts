import { useMemo } from 'react'
import type { Claim, Filters } from '../types'

export function useFilteredData(data: Claim[], filters: Filters, selectedDiagnosis: string | null) {
  return useMemo(() => {
    return data.filter(c => {
      if (filters.dateFrom && c.submitted_date < filters.dateFrom) return false
      if (filters.dateTo && c.submitted_date > filters.dateTo) return false
      if (filters.claimTypes.length && !filters.claimTypes.includes(c.claim_type)) return false
      if (filters.insurers.length && !filters.insurers.includes(c.insurer)) return false
      if (filters.countries.length && !filters.countries.includes(c.country)) return false
      if (filters.statuses.length && !filters.statuses.includes(c.status)) return false
      if (selectedDiagnosis && c.diagnosis_icd10 !== selectedDiagnosis) return false
      return true
    })
  }, [data, filters, selectedDiagnosis])
}
