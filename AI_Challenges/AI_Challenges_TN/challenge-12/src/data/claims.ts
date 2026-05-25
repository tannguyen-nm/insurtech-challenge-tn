import type { Claim } from '../types';

// 15 test claims — 5 per country — covering all rule types
// Submission date fixed to 2024-06-01 so rule versioning is testable (TH-DOC-004 effective 2024-07-01 should NOT apply)
export const testClaims: Claim[] = [
  // ── Thailand (TH) ──────────────────────────────────────────────────────────

  // TH-1: Fully compliant outpatient
  {
    claim_id: 'TH-CLAIM-001',
    country: 'TH',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'prescription'],
    national_id: '*****6789',
    processing_days: 10,
  },

  // TH-2: Missing discharge_summary (inpatient) → fails TH-DOC-002
  {
    claim_id: 'TH-CLAIM-002',
    country: 'TH',
    claim_type: 'INPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    national_id: '*****1234',
    processing_days: 5,
  },

  // TH-3: SLA exceeded for outpatient (20 days > 15 allowed) → fails TH-SLA-001
  {
    claim_id: 'TH-CLAIM-003',
    country: 'TH',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'prescription'],
    national_id: '*****5678',
    processing_days: 20,
  },

  // TH-4: Pre-existing, only 60 days into policy (< 120 required) → fails TH-WAIT-001
  {
    claim_id: 'TH-CLAIM-004',
    country: 'TH',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-03-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: true,
    documents: ['medical_receipt', 'prescription'],
    national_id: '*****9012',
    processing_days: 5,
  },

  // TH-5: Multiple failures — missing discharge_summary + national_id unmasked
  {
    claim_id: 'TH-CLAIM-005',
    country: 'TH',
    claim_type: 'INPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    national_id: '1234567890123',
    processing_days: 7,
  },

  // ── Vietnam (VN) ───────────────────────────────────────────────────────────

  // VN-1: Fully compliant outpatient
  {
    claim_id: 'VN-CLAIM-001',
    country: 'VN',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'id_card_copy'],
    full_name: 'N. Van N.',
    processing_days: 7,
  },

  // VN-2: Missing id_card_copy → fails VN-DOC-003
  {
    claim_id: 'VN-CLAIM-002',
    country: 'VN',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    full_name: 'T. Thi T.',
    processing_days: 5,
  },

  // VN-3: SLA exceeded (12 days > 10 allowed) → fails VN-SLA-001
  {
    claim_id: 'VN-CLAIM-003',
    country: 'VN',
    claim_type: 'INPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'hospital_certificate', 'id_card_copy'],
    full_name: 'L. Thi L.',
    processing_days: 12,
  },

  // VN-4: Pre-existing, 200 days into policy (< 365 required) → fails VN-WAIT-001
  {
    claim_id: 'VN-CLAIM-004',
    country: 'VN',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-07-19',
    policy_start_date: '2024-01-01',
    is_pre_existing: true,
    documents: ['medical_receipt', 'id_card_copy'],
    full_name: 'P. Van P.',
    processing_days: 5,
  },

  // VN-5: Multiple failures — missing hospital_certificate + full_name unmasked
  {
    claim_id: 'VN-CLAIM-005',
    country: 'VN',
    claim_type: 'INPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt', 'id_card_copy'],
    full_name: 'Nguyen Van An',
    processing_days: 8,
  },

  // ── Hong Kong (HK) ─────────────────────────────────────────────────────────

  // HK-1: Fully compliant outpatient
  {
    claim_id: 'HK-CLAIM-001',
    country: 'HK',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    hkid: 'A****3',
    processing_days: 15,
  },

  // HK-2: Specialist, missing referral_letter → fails HK-DOC-002
  {
    claim_id: 'HK-CLAIM-002',
    country: 'HK',
    claim_type: 'SPECIALIST',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    hkid: 'B****7',
    processing_days: 10,
  },

  // HK-3: General claim, 30 days into policy (< 60 required) → fails HK-WAIT-001
  {
    claim_id: 'HK-CLAIM-003',
    country: 'HK',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-01-31',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    hkid: 'C****2',
    processing_days: 5,
  },

  // HK-4: Multiple failures — inpatient missing discharge_summary + SLA exceeded
  {
    claim_id: 'HK-CLAIM-004',
    country: 'HK',
    claim_type: 'INPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    hkid: 'D****5',
    processing_days: 25,
  },

  // HK-5: HKID not masked → fails HK-MASK-001
  {
    claim_id: 'HK-CLAIM-005',
    country: 'HK',
    claim_type: 'OUTPATIENT',
    submission_date: '2024-06-01',
    policy_start_date: '2024-01-01',
    is_pre_existing: false,
    documents: ['medical_receipt'],
    hkid: 'AB123456',
    processing_days: 10,
  },
];
