export const SEVERITY: Record<string, number> = {
  duplicate: 5,
  phantom_billing: 5,
  upcoding: 4,
  weekend_anomaly: 4,
  dx_proc_mismatch: 4,
  rapid_resubmission: 3,
  unbundling: 3,
  amount_clustering: 3,
}

export const MAX_POSSIBLE = Object.values(SEVERITY).reduce((s, v) => s + v, 0) // 30

// Procedure bundles: claim triggers if it has ALL individual codes mapped to a bundle
export const BUNDLES: Record<string, string[]> = {
  'BUNDLE-A': ['P-0100', 'P-0101', 'P-0102'],
  'BUNDLE-B': ['P-0103', 'P-0104', 'P-0105'],
  'BUNDLE-C': ['P-0106', 'P-0107', 'P-0108'],
  'BUNDLE-D': ['P-0109', 'P-0110', 'P-0111'],
  'BUNDLE-E': ['P-0112', 'P-0113', 'P-0114'],
}

// Per-diagnosis valid procedure sets — claims with diagnosis in this map
// but procedure NOT in the allowed set are flagged as mismatch fraud.
export const VALID_DX_PROCS: Record<string, string[]> = {
  'J45.909': ['P-0107', 'P-0108'],
  'E11.9':   ['P-0112', 'P-0111'],
  'I10':     ['P-0110', 'P-0109', 'P-0127'],
  'M54.5':   ['P-0105', 'S-0300', 'P-0106'],
  'K21.0':   ['P-0104', 'P-0103'],
  'N39.0':   ['P-0116', 'P-0115'],
  'M79.3':   ['S-0302', 'P-0119', 'P-0120'],
  'K29.70':  ['P-0113', 'P-0114'],
  'M25.511': ['P-0120', 'P-0101', 'P-0118', 'P-0222', 'P-0127'],
  'R05':     ['P-0126', 'P-0125', 'P-0129'],
}

// Amount clustering: flag submitted_amount in [47500, 50000)
export const CLUSTER_LOW = 47500
export const CLUSTER_HIGH = 50000

// Surgical procedures: codes starting with "S-"
export const isSurgical = (code: string) => code.startsWith('S-')

// Weekend provider threshold
export const WEEKEND_RATE_THRESHOLD = 0.05

// Phantom billing: daily claim count threshold
export const PHANTOM_THRESHOLD = 30

// Upcoding: min samples for procedure stats
export const MIN_PROC_SAMPLES = 5

// Rapid re-submission window in days
export const RAPID_WINDOW_DAYS = 7

// Scoring threshold for fraud classification
export const SCORE_THRESHOLD = 10
