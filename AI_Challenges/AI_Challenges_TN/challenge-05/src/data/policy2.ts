import type { Policy } from '../types/policy';

export const policy2: Policy = {
  policy_number: 'POL-2024-TH-00412',
  policyholder: {
    name: 'Sarah Chen',
    type: 'INDIVIDUAL',
  },
  plan: {
    name: 'Individual Essential Care',
    tier: 'Silver',
    effective_date: '2024-03-01',
    expiry_date: '2025-02-28',
    currency: 'THB',
  },
  benefits: [
    {
      type: 'INPATIENT',
      annual_limit: 800000,
      sub_benefits: [
        { name: 'Room & Board', limit_per_day: 4000, max_days: 60 },
        { name: 'Surgery', limit_per_event: 200000 },
        { name: 'Ambulance', limit_per_event: 3000 },
      ],
    },
    {
      type: 'OUTPATIENT',
      annual_limit: 40000,
      waiting_period_days: 30,
      sub_benefits: [
        { name: 'Doctor Visit', limit_per_visit: 1500, visits_per_year: 20 },
        { name: 'Diagnostic Tests', limit_per_year: 10000 },
      ],
    },
    {
      type: 'DENTAL',
      annual_limit: 15000,
      waiting_period_days: 180,
      sub_benefits: [
        { name: 'Basic Dental', limit_per_year: 15000 },
      ],
    },
  ],
  exclusions: [
    'Pre-existing conditions within first 24 months',
    'Cosmetic and aesthetic treatments',
    'Mental health and psychiatric conditions',
    'HIV/AIDS related treatments',
    'Experimental or unproven treatments',
  ],
  copay: {
    inpatient: { percentage: 10, max_per_visit: 5000 },
    outpatient: { percentage: 30, max_per_visit: 300 },
    dental: { percentage: 20 },
  },
  network: {
    type: 'HMO',
    hospital_count: 120,
    countries: ['Thailand'],
  },
};
