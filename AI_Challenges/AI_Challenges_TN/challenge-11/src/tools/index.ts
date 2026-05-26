import { policyDB, documentStore, documentIndex, medicalNecessityTable } from "../data/mockData";
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
    description: "Verify whether a specific document has been submitted and is valid. Call with the documentId from the claim's submitted document list. Call once per document — verify ALL documents listed before proceeding.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        documentId: { type: SchemaType.STRING, description: "The document ID to verify (e.g. referral, medicalReport, itemizedReceipt, treatmentPlan, dischargeReport, itemizedInvoice, or a DOC-xxx ID)" },
      },
      required: ["documentId"],
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
      const documentId = input.documentId as string;

      // Primary lookup: flat index by documentId (e.g. "DOC-001-REF") or document type name
      if (documentIndex[documentId]) {
        return documentIndex[documentId];
      }

      // Fallback: treat documentId as a document type name, search across all claims
      for (const [claimId, docs] of Object.entries(documentStore)) {
        if (docs[documentId] !== undefined) {
          const doc = docs[documentId] as Record<string, unknown>;
          if (!doc.present) {
            return { documentId, claimId, documentType: documentId, present: false, valid: false, reason: doc.reason ?? "Document not submitted" };
          }
          return { documentId, claimId, documentType: documentId, ...doc };
        }
      }

      return {
        documentId,
        present: false,
        valid: false,
        reason: `Document '${documentId}' not found in any claim submission`,
      };
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
