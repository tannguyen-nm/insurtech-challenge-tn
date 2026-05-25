import "dotenv/config";
import fs from "fs";
import path from "path";
import { testCases } from "./data/mockData";
import { assessClaim } from "./agent/loop";
import type { CaseResult } from "./types";

const LOGS_DIR = path.join(__dirname, "..", "logs");

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set");
    process.exit(1);
  }

  fs.mkdirSync(LOGS_DIR, { recursive: true });

  console.log("═".repeat(60));
  console.log("  Claim Assessment AI Agent — Challenge 11");
  console.log("═".repeat(60));
  console.log(`  Running ${testCases.length} test cases...\n`);

  const results: CaseResult[] = [];

  for (const testCase of testCases) {
    console.log(`▶ Processing ${testCase.caseId} (${testCase.claimId}) — Expected: ${testCase.expectedOutcome}`);
    console.log(`  Type: ${testCase.claimType} | Amount: $${testCase.claimAmount.toLocaleString()}`);

    try {
      const result = await assessClaim(testCase);
      results.push(result);

      const logPath = path.join(LOGS_DIR, `${testCase.caseId}.json`);
      fs.writeFileSync(logPath, JSON.stringify(result, null, 2));

      const passed = result.assessmentReport.outcome === testCase.expectedOutcome;
      const status = passed ? "✓ PASS" : "✗ FAIL";
      console.log(`  ${status} — Outcome: ${result.assessmentReport.outcome}`);
      if (result.assessmentReport.coveredAmount != null) {
        console.log(`  Covered Amount: $${result.assessmentReport.coveredAmount.toLocaleString()}`);
      }
      console.log(`  Tool calls: ${result.toolCalls.map((t) => t.tool).join(" → ")}`);
      console.log(`  Log: ${logPath}\n`);
    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}\n`);
    }
  }

  // Summary
  console.log("═".repeat(60));
  console.log("  SUMMARY");
  console.log("═".repeat(60));
  for (const result of results) {
    const testCase = testCases.find((c) => c.caseId === result.caseId)!;
    const passed = result.assessmentReport.outcome === testCase.expectedOutcome;
    console.log(
      `  ${passed ? "✓" : "✗"} ${result.caseId}: ${result.assessmentReport.outcome} (expected ${testCase.expectedOutcome})`
    );
  }

  const passed = results.filter((r) => {
    const tc = testCases.find((c) => c.caseId === r.caseId)!;
    return r.assessmentReport.outcome === tc.expectedOutcome;
  }).length;
  console.log(`\n  ${passed}/${results.length} cases passed`);
  console.log("═".repeat(60));
}

run().catch(console.error);
