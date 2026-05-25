import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { toolDeclarations, executeTool } from "../tools";
import { SYSTEM_PROMPT } from "./systemPrompt";
import type { ClaimInput, ToolCallLog, AssessmentReport, CaseResult } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryDelay(err: unknown): number {
  const msg = (err as { message?: string })?.message ?? "";
  const match = msg.match(/Please retry in ([\d.]+)s/);
  return match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 30000;
}

async function sendWithRetry(
  fn: () => Promise<unknown>,
  retries = 5
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const is429 = err?.status === 429 || err?.message?.includes("429");
      const is503 = err?.status === 503 || err?.message?.includes("503");
      if ((is429 || is503) && i < retries - 1) {
        const delay = is429 ? parseRetryDelay(e) : 15000;
        console.log(`  ${is429 ? "Rate limited" : "Service unavailable"} — retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

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

Follow the mandatory tool call sequence: verify ALL documents → lookup policy → check medical necessity → calculate benefit. Then produce the structured assessment report.`;
}

function parseAssessmentReport(raw: string, caseId: string, claimId: string): AssessmentReport {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    return {
      caseId, claimId,
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
      caseId, claimId,
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
      caseId, claimId,
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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toolDeclarations }],
    generationConfig: { temperature: 0.1 },
  });

  const chat = model.startChat({ history: [] });

  type ChatResult = Awaited<ReturnType<typeof chat.sendMessage>>;

  let result = (await sendWithRetry(() =>
    chat.sendMessage(formatClaimForAssessment(claim))
  )) as ChatResult;

  let finalText = "";

  while (true) {
    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter(
      (p: Part) => "functionCall" in p && p.functionCall
    );

    if (functionCalls.length === 0) {
      finalText = parts
        .filter((p: Part) => "text" in p)
        .map((p: Part) => (p as { text: string }).text)
        .join("\n");
      break;
    }

    const responseParts: Part[] = functionCalls.map((p: Part) => {
      const fc = (p as { functionCall: { name: string; args: Record<string, unknown> } }).functionCall;
      const output = executeTool(fc.name, fc.args);
      toolCallLogs.push({ tool: fc.name, input: fc.args, output, timestamp: new Date().toISOString() });
      return { functionResponse: { name: fc.name, response: { result: output } } } as Part;
    });

    result = (await sendWithRetry(() =>
      chat.sendMessage(responseParts)
    )) as ChatResult;
  }

  const assessmentReport = parseAssessmentReport(finalText, claim.caseId, claim.claimId);
  return { caseId: claim.caseId, toolCalls: toolCallLogs, assessmentReport };
}
