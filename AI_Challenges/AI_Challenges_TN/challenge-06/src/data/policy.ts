import type { Policy } from '../types';

export const demoPolicy: Policy = {
  policy_number: 'POL-2024-DEMO-001',
  effective_date: '2024-01-01',
  expiry_date: '2024-12-31',
  currency: 'THB',
  deductible: 3000,
  benefits: [
    {
      type: 'INPATIENT',
      annual_limit: 40000,
      copay_percentage: 0,
      sub_benefits: [
        { name: 'Room & Board', limit_per_day: 3000 },
        { name: 'Surgery', limit_per_event: 30000 },
      ],
    },
    {
      type: 'OUTPATIENT',
      annual_limit: 18000,
      copay_percentage: 20,
      copay_max_per_visit: 500,
      sub_benefits: [
        { name: 'Doctor Visit', limit_per_visit: 1500, visits_per_year: 4 },
        { name: 'Prescribed Medicine', limit_per_visit: 1000 },
        { name: 'Diagnostic Tests', limit_per_year: 3000 },
      ],
    },
    {
      type: 'DENTAL',
      annual_limit: 6000,
      copay_percentage: 30,
      waiting_period_days: 90,
      sub_benefits: [
        { name: 'Basic Dental', limit_per_visit: 2000 },
        { name: 'Major Dental', limit_per_visit: 3000 },
      ],
    },
    {
      type: 'MATERNITY',
      annual_limit: 25000,
      copay_percentage: 0,
      waiting_period_days: 270,
      sub_benefits: [
        { name: 'Normal Delivery', limit_per_event: 20000 },
        { name: 'Prenatal Care', limit_per_visit: 1500 },
      ],
    },
  ],
  exclusions: ['Cosmetic surgery', 'Self-inflicted injuries', 'Experimental treatment'],
};
