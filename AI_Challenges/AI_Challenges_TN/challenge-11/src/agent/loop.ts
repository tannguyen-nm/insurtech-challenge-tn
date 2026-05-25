import Anthropic from "@anthropic-ai/sdk";
import { tools, executeTool } from "../tools";
import { SYSTEM_PROMPT } from "./systemPrompt";
import type { ClaimInput, ToolCallLog, AssessmentReport, CaseResult } from "../types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function formatClaimForAssessment(claim: ClaimInput): string {
  return `Please assess the following insurance claim:

**Claim ID:** ${claim.claimId}
**Case ID:** ${claim.caseId}
**Member ID:** ${claim.memberId}
**Policy ID:** ${claim.policyId}
**Claim Type:** ${claim.claimType}
**Date of Service:** ${claim.dateOfService}
**Diagnosis Code:** ${claim.diagnosisCode}
**Procedure Code:** ${claim.procedureCode}
**Claim Amount:** $${claim.claimAmount.toLocaleString()}
**Submitted Documents:** ${claim.submittedDocuments.join(", ")}

**Description:** ${claim.description}

Follow the mandatory tool call sequence: verify all documents → lookup policy → check medical necessity → calculate benefit. Then produce the structured assessment report.`;
}

function parseAssessmentReport(raw: string, caseId: string, claimId: string): AssessmentReport {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    return {
      caseId,
      claimId,
      outcome: "REQUEST_MORE_INFO",
      documentReview: "Parse error",
      policyVerification: "Parse error",
      medicalNecessity: "Parse error",
      benefitCalculation: "Parse error",
      recommendation: "Could not parse structured report",
      policyCitations: [],
      rawResponse: raw,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    return {
      caseId,
      claimId,
      outcome: parsed.outcome,
      coveredAmount: parsed.coveredAmount,
      documentReview: parsed.documentReview,
      policyVerification: parsed.policyVerification,
      medicalNecessity: parsed.medicalNecessity,
      benefitCalculation: parsed.benefitCalculation,
      recommendation: parsed.recommendation,
      policyCitations: parsed.policyCitations ?? [],
      rawResponse: raw,
    };
  } catch {
    return {
      caseId,
      claimId,
      outcome: "REQUEST_MORE_INFO",
      documentReview: "JSON parse error",
      policyVerification: "JSON parse error",
      medicalNecessity: "JSON parse error",
      benefitCalculation: "JSON parse error",
      recommendation: jsonMatch[1],
      policyCitations: [],
      rawResponse: raw,
    };
  }
}

export async function assessClaim(claim: ClaimInput): Promise<CaseResult> {
  const toolCallLogs: ToolCallLog[] = [];
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: formatClaimForAssessment(claim) },
  ];

  let finalText = "";

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      finalText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("\n");
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const timestamp = new Date().toISOString();
          const output = executeTool(block.name, block.input as Record<string, unknown>);

          toolCallLogs.push({
            tool: block.name,
            input: block.input,
            output,
            timestamp,
          });

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(output),
          };
        })
      );

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }
  }

  const assessmentReport = parseAssessmentReport(finalText, claim.caseId, claim.claimId);

  return { caseId: claim.caseId, toolCalls: toolCallLogs, assessmentReport };
}
