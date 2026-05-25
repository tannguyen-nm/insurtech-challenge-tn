import { policyDB, documentStore, medicalNecessityTable } from "../data/mockData";
import type { FunctionDeclaration } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";

// ── Tool Definitions (Gemini FunctionDeclaration format) ─────────────────────
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "lookupPolicy",
    description: "Look up policy terms, coverage limits, benefit details, exclusions, and clause references for a given policy ID. Always call this before calculateBenefit to get authoritative policy data.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        policyId: { type: SchemaType.STRING, description: "The policy ID to look up (e.g. POL-001)" },
      },
      required: ["policyId"],
    },
  },
  {
    name: "verifyDocument",
    description: "Verify whether a specific document has been submitted and is valid for a given claim. Call this once per document type. Must verify ALL documents listed in the claim before proceeding.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        claimId: { type: SchemaType.STRING, description: "The claim ID" },
        documentType: { type: SchemaType.STRING, description: "Document type to verify (e.g. referral, medicalReport, itemizedReceipt, treatmentPlan, dischargeReport, itemizedInvoice)" },
      },
      required: ["claimId", "documentType"],
    },
  },
  {
    name: "checkMedicalNecessity",
    description: "Check whether a procedure is medically necessary for a given diagnosis using a validated clinical lookup table. Returns necessity determination and clinical rationale.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        diagnosisCode: { type: SchemaType.STRING, description: "ICD-10 diagnosis code (e.g. J06.9)" },
        procedureCode: { type: SchemaType.STRING, description: "CPT or CDT procedure code (e.g. 99214)" },
      },
      required: ["diagnosisCode", "procedureCode"],
    },
  },
  {
    name: "calculateBenefit",
    description: "Calculate the covered benefit amount based on policy terms, claim amount, remaining annual limit, copay, and deductible. Requires policy data from lookupPolicy.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        policyId: { type: SchemaType.STRING, description: "Policy ID" },
        claimType: { type: SchemaType.STRING, description: "Type of claim: Outpatient, Inpatient, or Dental" },
        claimAmount: { type: SchemaType.NUMBER, description: "Total claimed amount in USD" },
        daysOrVisits: { type: SchemaType.NUMBER, description: "Number of days (inpatient) or visits (outpatient). Use 1 if not applicable." },
      },
      required: ["policyId", "claimType", "claimAmount", "daysOrVisits"],
    },
  },
];

// ── Tool Implementations ─────────────────────────────────────────────────────
export function executeTool(name: string, input: Record<string, unknown>): unknown {
  switch (name) {
    case "lookupPolicy": {
      const policyId = input.policyId as string;
      const policy = policyDB[policyId];
      if (!policy) return { error: `Policy ${policyId} not found in database` };
      return policy;
    }

    case "verifyDocument": {
      const claimId = input.claimId as string;
      const documentType = input.documentType as string;
      const claimDocs = documentStore[claimId];
      if (!claimDocs) return { error: `No documents found for claim ${claimId}` };
      const doc = claimDocs[documentType];
      if (!doc) {
        return {
          claimId,
          documentType,
          present: false,
          valid: false,
          reason: `Document type '${documentType}' was not submitted with claim ${claimId}`,
        };
      }
      return { claimId, documentType, ...doc };
    }

    case "checkMedicalNecessity": {
      const diagnosisCode = input.diagnosisCode as string;
      const procedureCode = input.procedureCode as string;
      const key = `${diagnosisCode}|${procedureCode}`;
      const result = medicalNecessityTable[key];
      if (!result) {
        return {
          isNecessary: false,
          rationale: `Diagnosis-procedure pair ${diagnosisCode}/${procedureCode} not found in clinical necessity table. Manual review required.`,
        };
      }
      return result;
    }

    case "calculateBenefit": {
      const policyId = input.policyId as string;
      const claimType = input.claimType as string;
      const claimAmount = input.claimAmount as number;
      const daysOrVisits = input.daysOrVisits as number;
      const policy = policyDB[policyId] as Record<string, unknown> | undefined;

      if (!policy) return { error: `Policy ${policyId} not found` };

      const remainingLimit = policy.remainingLimit as number;
      const copayPct = policy.copayPercentage as number;
      const benefits = policy.benefits as Record<string, Record<string, unknown>>;
      const benefit = benefits[claimType.toLowerCase()];

      if (!benefit) {
        return {
          covered: false,
          reason: `Claim type '${claimType}' is not covered under policy ${policyId}`,
          coveredAmount: 0,
        };
      }

      const limitPerUnit = (benefit.limitPerVisit ?? benefit.limitPerDay ?? claimAmount) as number;
      const cappedPerUnit = Math.min(claimAmount / daysOrVisits, limitPerUnit) * daysOrVisits;
      const cappedByAnnual = Math.min(cappedPerUnit, remainingLimit);

      if (cappedByAnnual <= 0) {
        return {
          covered: false,
          reason: `Annual limit exhausted. Remaining: $${remainingLimit.toLocaleString()}. Claim of $${claimAmount.toLocaleString()} cannot be covered.`,
          claimedAmount: claimAmount,
          remainingLimit,
          coveredAmount: 0,
          memberResponsibility: claimAmount,
          appliedClauses: [(policy.clauses as Record<string, string>)?.annualLimit ?? "Section 2.1"],
        };
      }

      const insurerPays = cappedByAnnual * (1 - copayPct / 100);
      const memberPays = claimAmount - insurerPays;

      return {
        covered: true,
        claimedAmount: claimAmount,
        eligibleAmount: cappedByAnnual,
        copayPercentage: copayPct,
        coveredAmount: Math.round(insurerPays * 100) / 100,
        memberResponsibility: Math.round(memberPays * 100) / 100,
        remainingLimitAfterClaim: Math.round((remainingLimit - cappedByAnnual) * 100) / 100,
        limitPerUnit,
        appliedClauses: [
          (policy.clauses as Record<string, string>)?.annualLimit ?? "Section 2.1",
          (policy.clauses as Record<string, string>)?.copay ?? "Section 4.1",
        ],
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
