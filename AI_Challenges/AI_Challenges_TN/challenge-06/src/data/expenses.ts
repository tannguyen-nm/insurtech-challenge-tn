import type { Expense } from '../types';

// 20 expenses exercising all rule scenarios.
// Dental waiting period ends: 2024-03-31 (90 days from 2024-01-01)
// Maternity waiting period ends: 2024-09-27 (270 days from 2024-01-01)
// Deductible: 3000 THB (EXP-001 absorbs 800, EXP-002 absorbs 1500, EXP-003 absorbs remaining 700)
export const demoExpenses: Expense[] = [
  // --- Group A: Deductible absorption ---
  {
    expense_id: 'EXP-001',
    date: '2024-01-08',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 800,
    diagnosis: 'Common cold and mild fever',
    provider: 'Bangkok Hospital',
  },
  {
    expense_id: 'EXP-002',
    date: '2024-01-22',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 1500,
    diagnosis: 'Acute sinusitis',
    provider: 'Samitivej Hospital',
  },
  {
    expense_id: 'EXP-003',
    date: '2024-02-01',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 1500,
    diagnosis: 'Seasonal allergic rhinitis',
    provider: 'Bumrungrad Hospital',
  },

  // --- Group B: Denied — waiting period ---
  {
    expense_id: 'EXP-004',
    date: '2024-02-15',
    benefit_type: 'DENTAL',
    sub_benefit: 'Basic Dental',
    amount: 2000,
    diagnosis: 'Tooth decay and cavity filling',
    provider: 'Dental Care Clinic',
  },
  {
    expense_id: 'EXP-005',
    date: '2024-03-01',
    benefit_type: 'MATERNITY',
    sub_benefit: 'Prenatal Care',
    amount: 3000,
    diagnosis: 'First trimester prenatal checkup',
    provider: 'Women Health Center',
  },

  // --- Group C: Denied — exclusion ---
  {
    expense_id: 'EXP-006',
    date: '2024-03-10',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 5000,
    diagnosis: 'Rhinoplasty consultation (cosmetic surgery)',
    provider: 'Aesthetic Clinic',
  },
  {
    expense_id: 'EXP-007',
    date: '2024-03-20',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Surgery',
    amount: 20000,
    diagnosis: 'Self-inflicted laceration repair',
    provider: 'General Hospital',
  },

  // --- Group D: Partially covered — copay only (deductible already met) ---
  {
    expense_id: 'EXP-008',
    date: '2024-04-01',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Prescribed Medicine',
    amount: 800,
    diagnosis: 'Antibiotic prescription for respiratory infection',
    provider: 'Bangkok Hospital',
  },
  {
    expense_id: 'EXP-009',
    date: '2024-04-15',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Prescribed Medicine',
    amount: 1200,
    diagnosis: 'Chronic hypertension medication',
    provider: 'Samitivej Hospital',
  },
  {
    expense_id: 'EXP-010',
    date: '2024-05-01',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Diagnostic Tests',
    amount: 4000,
    diagnosis: 'Full blood panel and lipid profile',
    provider: 'Bumrungrad Hospital',
  },

  // --- Group E: Fully covered — INPATIENT (no copay) ---
  {
    expense_id: 'EXP-011',
    date: '2024-05-20',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Room & Board',
    amount: 2800,
    diagnosis: 'Pneumonia — 1 day hospitalization',
    provider: 'Bangkok Hospital',
  },
  {
    expense_id: 'EXP-012',
    date: '2024-06-01',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Room & Board',
    amount: 3000,
    diagnosis: 'Appendicitis recovery — 1 day post-op',
    provider: 'Samitivej Hospital',
  },
  {
    expense_id: 'EXP-013',
    date: '2024-06-15',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Surgery',
    amount: 25000,
    diagnosis: 'Appendectomy',
    provider: 'Samitivej Hospital',
  },
  {
    expense_id: 'EXP-014',
    date: '2024-07-01',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Room & Board',
    amount: 3000,
    diagnosis: 'Post-surgery observation — 1 day',
    provider: 'Samitivej Hospital',
  },
  {
    expense_id: 'EXP-015',
    date: '2024-07-15',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Room & Board',
    amount: 3000,
    diagnosis: 'Kidney stone treatment — 1 day hospitalization',
    provider: 'Bumrungrad Hospital',
  },

  // --- Group F: Last allowed visit, then exhausted ---
  {
    expense_id: 'EXP-016',
    date: '2024-07-25',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 1500,
    diagnosis: 'Follow-up after kidney stone treatment',
    provider: 'Bumrungrad Hospital',
  },
  {
    expense_id: 'EXP-017',
    date: '2024-08-01',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Doctor Visit',
    amount: 1000,
    diagnosis: 'General wellness checkup',
    provider: 'Bangkok Hospital',
  },

  // --- Group G: Sub-benefit annual limit exhausted ---
  {
    expense_id: 'EXP-018',
    date: '2024-08-15',
    benefit_type: 'OUTPATIENT',
    sub_benefit: 'Diagnostic Tests',
    amount: 2000,
    diagnosis: 'Thyroid function test',
    provider: 'Samitivej Hospital',
  },

  // --- Group H: Partially covered — remaining annual limit < expense ---
  {
    expense_id: 'EXP-019',
    date: '2024-08-20',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Surgery',
    amount: 20000,
    diagnosis: 'Gallbladder removal (laparoscopic cholecystectomy)',
    provider: 'Bangkok Hospital',
  },

  // --- Group I: Annual limit fully exhausted — denied ---
  {
    expense_id: 'EXP-020',
    date: '2024-09-01',
    benefit_type: 'INPATIENT',
    sub_benefit: 'Room & Board',
    amount: 3000,
    diagnosis: 'Post-operative recovery — 1 day',
    provider: 'Bangkok Hospital',
  },
];
