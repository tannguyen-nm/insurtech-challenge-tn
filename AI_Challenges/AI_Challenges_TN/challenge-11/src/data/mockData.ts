import type { ClaimInput } from "../types";

// ── Policy Database ──────────────────────────────────────────────────────────
export const policyDB: Record<string, unknown> = {
  "POL-001": {
    policyId: "POL-001",
    memberId: "MEM-001",
    status: "ACTIVE",
    effectiveDate: "2024-01-01",
    expiryDate: "2026-12-31",
    coverageType: "Comprehensive",
    annualLimit: 100000,
    usedAmount: 8500,
    remainingLimit: 91500,
    copayPercentage: 20,
    deductible: 500,
    deductibleMet: true,
    benefits: {
      outpatient: {
        covered: true,
        limitPerVisit: 3000,
        visitsPerYear: 52,
        clause: "Section 3.1: Outpatient Benefit — covered up to $3,000 per visit, 52 visits per year",
      },
      inpatient: {
        covered: true,
        limitPerDay: 5000,
        daysPerYear: 60,
        clause: "Section 3.2: Inpatient Benefit — covered up to $5,000 per day, 60 days per year",
      },
      dental: {
        covered: true,
        limitPerYear: 5000,
        requiresTreatmentPlan: true,
        clause: "Section 3.4: Dental Benefit — covered up to $5,000/year; treatment plan required for procedures >$500",
      },
    },
    exclusions: ["cosmetic procedures", "experimental treatments", "pre-existing conditions (first 12 months)"],
    clauses: {
      annualLimit: "Section 2.1: Annual Benefit Limit — total claims cannot exceed $100,000 per policy year",
      copay: "Section 4.1: Copayment — member is responsible for 20% of covered amount after deductible",
      documentRequirements: "Section 5.1: Claim Documentation — all claims require valid referral, medical report, and itemized receipt",
    },
  },

  "POL-002": {
    policyId: "POL-002",
    memberId: "MEM-002",
    status: "ACTIVE",
    effectiveDate: "2024-01-01",
    expiryDate: "2026-12-31",
    coverageType: "Standard",
    annualLimit: 50000,
    usedAmount: 48200,
    remainingLimit: 1800,
    copayPercentage: 30,
    deductible: 1000,
    deductibleMet: true,
    benefits: {
      inpatient: {
        covered: true,
        limitPerDay: 3000,
        daysPerYear: 30,
        clause: "Section 3.2: Inpatient Benefit — covered up to $3,000 per day, 30 days per year",
      },
    },
    exclusions: ["dental", "cosmetic procedures", "experimental treatments"],
    clauses: {
      annualLimit: "Section 2.1: Annual Benefit Limit — total claims cannot exceed $50,000 per policy year",
      copay: "Section 4.1: Copayment — member is responsible for 30% of covered amount after deductible",
      limitExhaustion: "Section 2.3: Limit Exhaustion — claims submitted after annual limit is exhausted will be rejected",
    },
  },

  "POL-003": {
    policyId: "POL-003",
    memberId: "MEM-003",
    status: "ACTIVE",
    effectiveDate: "2024-01-01",
    expiryDate: "2026-12-31",
    coverageType: "Comprehensive Plus",
    annualLimit: 150000,
    usedAmount: 12000,
    remainingLimit: 138000,
    copayPercentage: 10,
    deductible: 0,
    deductibleMet: true,
    benefits: {
      dental: {
        covered: true,
        limitPerYear: 10000,
        requiresTreatmentPlan: true,
        clause: "Section 3.4: Dental Benefit — covered up to $10,000/year; treatment plan required for procedures >$200",
      },
    },
    exclusions: ["cosmetic procedures", "experimental treatments"],
    clauses: {
      annualLimit: "Section 2.1: Annual Benefit Limit — total claims cannot exceed $150,000 per policy year",
      copay: "Section 4.1: Copayment — member is responsible for 10% of covered amount",
      documentRequirements: "Section 5.1: Claim Documentation — dental claims require itemized invoice AND signed treatment plan",
      dentalRequirements: "Section 5.3: Dental Documentation — treatment plan signed by licensed dentist is mandatory for all dental claims",
    },
  },
};

// ── Document Store ───────────────────────────────────────────────────────────
export const documentStore: Record<string, Record<string, unknown>> = {
  "CLM-001": {
    referral:        { present: true,  valid: true,  docId: "DOC-001-REF", documentType: "referral" },
    medicalReport:   { present: true,  valid: true,  docId: "DOC-001-MED", documentType: "medicalReport" },
    itemizedReceipt: { present: true,  valid: true,  docId: "DOC-001-REC", documentType: "itemizedReceipt" },
  },
  "CLM-002": {
    referral:        { present: true,  valid: true,  docId: "DOC-002-REF", documentType: "referral" },
    medicalReport:   { present: true,  valid: true,  docId: "DOC-002-MED", documentType: "medicalReport" },
    itemizedReceipt: { present: true,  valid: true,  docId: "DOC-002-REC", documentType: "itemizedReceipt" },
    dischargeReport: { present: true,  valid: true,  docId: "DOC-002-DIS", documentType: "dischargeReport" },
  },
  "CLM-003": {
    itemizedInvoice: { present: true,  valid: true,  docId: "DOC-003-INV", documentType: "itemizedInvoice" },
    treatmentPlan:   { present: false, valid: false, docId: null,          documentType: "treatmentPlan", reason: "Treatment plan was not submitted with the claim" },
  },
  "CLM-004": {
    // Wrong type submitted: member sent a referral where a medicalReport is required.
    // referral is present but does not satisfy medicalReport requirement.
    referral:        { present: true,  valid: true,  docId: "DOC-004-REF", documentType: "referral" },
    medicalReport:   { present: true,  valid: false, docId: "DOC-004-MED", documentType: "medicalReport",
                       reason: "Document submitted does not match expected type: received referral letter instead of medical report. Please resubmit with the correct document." },
    itemizedReceipt: { present: true,  valid: true,  docId: "DOC-004-REC", documentType: "itemizedReceipt" },
  },
};

// ── Flat Document Index (keyed by docId for verifyDocument(documentId) spec) ─
export const documentIndex: Record<string, unknown> = Object.fromEntries(
  Object.entries(documentStore).flatMap(([claimId, docs]) =>
    Object.entries(docs)
      .filter(([, doc]) => (doc as Record<string, unknown>).docId)
      .map(([documentType, doc]) => {
        const d = doc as Record<string, unknown>;
        return [d.docId as string, { claimId, documentType, ...d }];
      })
  )
);

// ── Medical Necessity Lookup Table ───────────────────────────────────────────
export const medicalNecessityTable: Record<string, { isNecessary: boolean; rationale: string }> = {
  "J06.9|99213": { isNecessary: true, rationale: "Upper respiratory infection with office visit is medically appropriate and standard of care" },
  "J06.9|99214": { isNecessary: true, rationale: "Upper respiratory infection with detailed office visit is appropriate for moderate complexity" },
  "M54.5|99213": { isNecessary: true, rationale: "Low back pain evaluated with office visit is standard and necessary" },
  "M54.5|99214": { isNecessary: true, rationale: "Low back pain with detailed evaluation is appropriate for moderate-to-severe cases" },
  "I10|99213": { isNecessary: true, rationale: "Hypertension management with routine office visit is standard of care" },
  "Z00.00|99395": { isNecessary: true, rationale: "Annual preventive care is medically appropriate and recommended" },
  "K21.0|99213": { isNecessary: true, rationale: "GERD evaluation with office visit is medically necessary" },
  "K08.1|D2750": { isNecessary: true, rationale: "Tooth decay treated with crown is a standard and necessary dental procedure" },
  "K08.1|D2392": { isNecessary: true, rationale: "Tooth restoration for decay is medically necessary dental treatment" },
  "K08.2|D7110": { isNecessary: true, rationale: "Simple extraction of non-restorable tooth is medically necessary" },
  "S62.001A|99283": { isNecessary: true, rationale: "Wrist fracture evaluated in emergency setting is medically necessary" },
  "J18.9|99285": { isNecessary: true, rationale: "Pneumonia presenting to emergency department requires urgent evaluation" },
  "J18.9|99232": { isNecessary: true, rationale: "Pneumonia requiring inpatient management is medically necessary" },
  "N39.0|99213": { isNecessary: true, rationale: "Urinary tract infection with office visit is standard treatment" },
  "E11.9|99213": { isNecessary: true, rationale: "Type 2 diabetes management with office visit is medically necessary" },
  "E11.9|99214": { isNecessary: true, rationale: "Type 2 diabetes with complications requiring detailed evaluation is necessary" },
  "F32.1|90834": { isNecessary: true, rationale: "Major depressive disorder treated with psychotherapy is medically indicated" },
  "M17.11|27447": { isNecessary: true, rationale: "Severe knee osteoarthritis treated with total knee replacement is medically necessary after conservative treatment failure" },
  "G43.909|99213": { isNecessary: true, rationale: "Migraine evaluation and management with office visit is appropriate" },
  "Z87.891|99213": { isNecessary: false, rationale: "Follow-up for history of tobacco use without active symptoms does not require separate office visit" },
};

// ── Member Database ──────────────────────────────────────────────────────────
export const memberDB: Record<string, unknown> = {
  "MEM-001": { memberId: "MEM-001", name: "Alice Johnson", dob: "1985-03-15", policyId: "POL-001" },
  "MEM-002": { memberId: "MEM-002", name: "Bob Smith", dob: "1970-07-22", policyId: "POL-002" },
  "MEM-003": { memberId: "MEM-003", name: "Carol Davis", dob: "1990-11-08", policyId: "POL-003" },
};

// ── Test Cases ───────────────────────────────────────────────────────────────
export const testCases: ClaimInput[] = [
  {
    caseId: "case_1",
    claimId: "CLM-001",
    memberId: "MEM-001",
    policyId: "POL-001",
    claimType: "Outpatient",
    diagnosisCode: "J06.9",
    procedureCode: "99214",
    claimAmount: 1200,
    dateOfService: "2025-05-10",
    submittedDocuments: ["referral", "medicalReport", "itemizedReceipt"],
    description: "Outpatient visit for upper respiratory infection with detailed examination. All required documents submitted. Claim amount of $1,200 is within the per-visit outpatient limit.",
    expectedOutcome: "APPROVE",
  },
  {
    caseId: "case_2",
    claimId: "CLM-002",
    memberId: "MEM-002",
    policyId: "POL-002",
    claimType: "Inpatient",
    diagnosisCode: "J18.9",
    procedureCode: "99232",
    claimAmount: 15000,
    dateOfService: "2025-05-12",
    submittedDocuments: ["referral", "medicalReport", "itemizedReceipt", "dischargeReport"],
    description: "Inpatient admission for pneumonia, 5-day stay at $3,000/day. All documents present and medical necessity is valid. However, member has already used $48,200 of their $50,000 annual limit, leaving only $1,800 remaining.",
    expectedOutcome: "REJECT",
  },
  {
    caseId: "case_3",
    claimId: "CLM-003",
    memberId: "MEM-003",
    policyId: "POL-003",
    claimType: "Dental",
    diagnosisCode: "K08.1",
    procedureCode: "D2750",
    claimAmount: 2800,
    dateOfService: "2025-05-14",
    submittedDocuments: ["itemizedInvoice", "treatmentPlan"],
    description: "Dental crown procedure for tooth decay. Policy covers dental up to $10,000/year with $138,000 remaining on annual limit. However, the required dentist-signed treatment plan was not submitted.",
    expectedOutcome: "REQUEST_MORE_INFO",
  },
  {
    caseId: "case_4",
    claimId: "CLM-004",
    memberId: "MEM-001",
    policyId: "POL-001",
    claimType: "Outpatient",
    diagnosisCode: "M54.5",
    procedureCode: "99213",
    claimAmount: 800,
    dateOfService: "2025-06-01",
    submittedDocuments: ["referral", "medicalReport", "itemizedReceipt"],
    description: "Outpatient visit for low back pain. All three document slots submitted, but the medicalReport slot contains a referral letter instead of an actual medical report — wrong document type. Policy and medical necessity are otherwise valid.",
    expectedOutcome: "REQUEST_MORE_INFO",
  },
];
