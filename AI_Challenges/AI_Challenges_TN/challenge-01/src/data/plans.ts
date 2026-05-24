export interface OutpatientBenefit {
  limit_per_visit: number;
  visits_per_year: number; // -1 = unlimited
}

export interface InpatientBenefit {
  limit_per_day: number;
  days_per_year: number; // -1 = unlimited
}

export interface DentalBenefit {
  limit_per_year: number;
}

export interface MaternityBenefit {
  limit_per_pregnancy: number;
}

export interface Benefits {
  outpatient: OutpatientBenefit;
  inpatient: InpatientBenefit;
  dental: DentalBenefit | null;
  maternity: MaternityBenefit | null;
}

export interface Plan {
  name: string;
  monthly_premium: number;
  annual_limit: number;
  benefits: Benefits;
  copay_percentage: number;
  waiting_period_days: number;
  highlights: string[];
}

export const plans: Plan[] = [
  {
    name: "Bronze",
    monthly_premium: 150,
    annual_limit: 500000,
    benefits: {
      outpatient: { limit_per_visit: 3000, visits_per_year: 30 },
      inpatient: { limit_per_day: 10000, days_per_year: 60 },
      dental: null,
      maternity: null,
    },
    copay_percentage: 20,
    waiting_period_days: 30,
    highlights: ["Basic coverage", "No dental or maternity"],
  },
  {
    name: "Silver",
    monthly_premium: 350,
    annual_limit: 1500000,
    benefits: {
      outpatient: { limit_per_visit: 5000, visits_per_year: 60 },
      inpatient: { limit_per_day: 25000, days_per_year: 120 },
      dental: { limit_per_year: 30000 },
      maternity: null,
    },
    copay_percentage: 10,
    waiting_period_days: 15,
    highlights: ["Includes dental", "Lower copay", "Higher limits"],
  },
  {
    name: "Gold",
    monthly_premium: 700,
    annual_limit: 5000000,
    benefits: {
      outpatient: { limit_per_visit: 10000, visits_per_year: -1 },
      inpatient: { limit_per_day: 50000, days_per_year: -1 },
      dental: { limit_per_year: 100000 },
      maternity: { limit_per_pregnancy: 200000 },
    },
    copay_percentage: 0,
    waiting_period_days: 0,
    highlights: ["Full coverage", "No copay", "No waiting period", "Unlimited visits"],
  },
];
