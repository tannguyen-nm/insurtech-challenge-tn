# Papaya Insurance — Engineering Assessment

Two-part assessment for engineering candidates: a set of **Logical Thinking Questions** and a set of **AI Engineering Challenges**.

---

## Part 1 — Logical Thinking Questions

[`Logical_Questions/`](./Logical_Questions/)

13 short questions designed to reveal how a candidate thinks — not to score right/wrong. Used alongside the engineering challenges to get a complete picture: the technical part shows what they can build; this part shows how they observe, name, design, and reason.

**Skill areas covered:**

| Tag | Skill |
|---|---|
| N | Naming — aesthetic sense, playfulness in labelling |
| M | Memory retrieval — how they access and describe recollection |
| Cr | Critical thinking — separating frame from content |
| P | Pattern recognition — finding common structure across situations |
| Q | General reasoning — speed and precision of step-by-step logic |
| O | Observation — noticing small details about people, places, behaviour |
| S | Self-awareness — knowing preferences, motivation, limits without defensiveness |
| Cu | Curiosity — following a thread for enjoyment, not reward |
| G | Giving — defaulting to others, not just self-optimising |
| D | Design — turning constraints into something concrete and usable |

Questions and evaluation guide: [`Logical_Questions/README.md`](./Logical_Questions/README.md)  
Sample answers: [`Logical_Questions/ANSWER.md`](./Logical_Questions/ANSWER.md)

---

## Part 2 — AI Engineering Challenges

15 progressive challenges for an insurance platform — from UI components to AI agents, each deployed independently to Vercel.

| # | Challenge | Live URL | Stack |
|---|---|---|---|
| 01 | Insurance Plan Comparison Page | [insurtech-challenge-01.vercel.app](https://insurtech-challenge-01.vercel.app) | React + Vite |
| 02 | Claims Data Cleanup & Report | CLI only | Node.js + TypeScript |
| 03 | Claim Notification Email Templates | [insurtech-challenge-03.vercel.app](https://insurtech-challenge-03.vercel.app) | HTML/CSS |
| 04 | Insurance Glossary Search App | [insurtech-challenge-04.vercel.app](https://insurtech-challenge-04.vercel.app) | React + Vite |
| 05 | Policy Summary Generator | [insurtech-challenge-05.vercel.app](https://insurtech-challenge-05.vercel.app) | React + Vite |
| 06 | Policy Benefits Calculator | [insurtech-challenge-06.vercel.app](https://insurtech-challenge-06.vercel.app) | React + Vite |
| 07 | Claims Intake Wizard | [insurtech-challenge-07.vercel.app](https://insurtech-challenge-07.vercel.app) | Next.js |
| 08 | Medical Document Extractor | CLI only | Node.js + Claude Vision API |
| 09 | Claims Analytics Dashboard | [insurtech-challenge-09.vercel.app](https://insurtech-challenge-09.vercel.app) | React + Vite |
| 10 | Fraud Detection Scoring Engine | CLI only | Node.js + TypeScript |
| 11 | Claim Assessment AI Agent | CLI only | Node.js + Claude API |
| 12 | Multi-Country Regulatory Rule Engine | [insurtech-challenge-12.vercel.app](https://insurtech-challenge-12.vercel.app) | React + Vite |
| 13 | Partner Integration SDK | [insurtech-challenge-13.vercel.app](https://insurtech-challenge-13.vercel.app) | TypeScript SDK + Express |
| 14 | Claims Workflow Orchestrator | [insurtech-challenge-14.vercel.app](https://insurtech-challenge-14.vercel.app) | React + Vite |
| 15 | Multi-Tenant Configuration Platform | [insurtech-challenge-15.vercel.app](https://insurtech-challenge-15.vercel.app) | Next.js |

Each challenge has its own `README.md` with setup and feature details under `AI_Challenges/AI_Challenges_TN/challenge-XX/`.

---

## Structure

```
.
├── AI_Challenges/
│   ├── AI_Challenges_TN/     # 15 challenge implementations (Tan Nguyen)
│   └── AI_ENGINEERING_CHALLENGES/  # Challenge spec sheets
├── AI_Challenges_Plan/       # Detailed implementation plans per challenge
├── Logical_Questions/
│   ├── README.md             # 13 questions + interviewer guide
│   └── ANSWER.md             # Sample personal answers
└── README.md                 # This file
```
