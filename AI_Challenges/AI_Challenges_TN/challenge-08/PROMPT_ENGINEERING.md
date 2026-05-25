# Prompt Engineering Writeup — Medical Document Extractor

## Overview

Two-stage pipeline: classify first, then extract with type-specific prompts. Separating concerns keeps each prompt focused and avoids the model needing to guess the schema while also reading the document.

## Stage 1 — Classification

**Prompt design:** Minimal one-shot prompt. Asked Claude to pick one of four exact enum values and return JSON `{type, confidence, reasoning}`. No chain-of-thought — classification of a well-designed document is a fast pattern match, not a reasoning task.

**What worked:** The model reliably classified all 10 documents correctly. Key design choices in document templates that helped:
- Clear header text (`RECEIPT`, `LABORATORY REPORT`, `DISCHARGE SUMMARY`, `Rx` symbol)
- Visual layout distinctly different per type (tables with lab flags vs. itemized billing vs. medication list)

**Confidence calibration:** Kept the prompt asking for a float `0.0–1.0`. On well-rendered documents it returned 0.95–0.99. A degraded or ambiguous document would lower this — we validated this is meaningful, not hardcoded.

## Stage 2 — Field Extraction

**System prompt with prompt caching:** The extraction system prompt (role definition + confidence rules) is sent with `cache_control: {type: "ephemeral"}`. This is cached across all 10 extraction calls, saving ~400 tokens per call.

**Per-type schema in user message:** Each doc type gets its own exact JSON schema in the user prompt. This is effectively few-shot structural guidance — the model sees exactly what keys and value types to return. No ambiguity.

**Null enforcement:** The most critical prompt constraint is:
> "If a field is not present in the document, return {"value": null, "confidence": 0.1}."
> "If you cannot see the field clearly, you MUST return null and confidence < 0.3."

This prevents hallucination. Without explicit null instructions, the model tends to fabricate plausible-looking values (e.g., inventing a payment method if it isn't printed).

**Lab flag derivation:** The lab report prompt tells the model to "compare result to reference range to determine flag." This is a reasoning step — the model must parse e.g. `"Reference: 70–99"` and compare to `186` to return `"high"`. This worked reliably because the reference ranges are in the same row as the result.

## Confidence Calibration

Confidence rules in the system prompt use explicit numeric ranges:
- 1.0 = clearly printed, unambiguous
- 0.7–0.9 = slightly degraded
- 0.3–0.6 = inferred from context
- <0.3 = not visible → value must be null

In practice, on cleanly generated PNGs, most fields scored 0.90–0.99. The model lowered confidence on fields that required parsing (e.g., items list with many rows) versus single scalar fields. This is meaningful signal — if we fed in a scanned low-res document, the confidence distribution would shift lower.

## Hallucination Prevention

- **Explicit null instruction** in both system and user messages
- **Schema-first approach** — the model fills slots, not free-form narration
- **Separate classification from extraction** — model isn't trying to guess type while extracting
- **JSON regex extraction** — parse `/{...}/` from response; if no valid JSON, pipeline errors loudly rather than returning garbage

## What Didn't Work Initially

1. **Single combined prompt** (classify + extract in one call): model sometimes started extraction in wrong schema before settling. Splitting into two calls fixed this cleanly.

2. **Asking for confidence on array fields** as a flat 0.0–1.0 is under-specified — should it be per-item or overall? Solution: treat the array field as a single entry with overall confidence; per-item confidence would require a different schema and wasn't required by the spec.

## Techniques Used

| Technique | Where |
|---|---|
| Structured output (schema in prompt) | Extraction stage |
| Prompt caching | Extraction system prompt |
| Enum constraint | Classification stage |
| Explicit null instruction | Both stages |
| Two-stage pipeline | Overall architecture |
| Regex JSON extraction | Response parsing |
