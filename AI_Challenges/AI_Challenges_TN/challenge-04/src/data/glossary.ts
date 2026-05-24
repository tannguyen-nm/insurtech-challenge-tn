export type Category =
  | "General Insurance"
  | "Claims"
  | "Coverage"
  | "Life & Health"
  | "Reinsurance"
  | "Regulatory";

export interface Term {
  id: string;
  name: string;
  definition: string;
  category: Category;
  relatedTerms: string[];
}

export const glossary: Term[] = [
  // ── General Insurance ──────────────────────────────────────────────────────
  {
    id: "premium",
    name: "Premium",
    category: "General Insurance",
    definition:
      "The amount paid by the policyholder to the insurer, typically on a monthly or annual basis, in exchange for insurance coverage. Premiums are calculated based on risk factors such as age, health status, location, and claims history.",
    relatedTerms: ["deductible", "underwriting", "policy", "copay"],
  },
  {
    id: "deductible",
    name: "Deductible",
    category: "General Insurance",
    definition:
      "The fixed amount the insured must pay out of pocket before the insurance company begins to cover costs. For example, with a $1,000 deductible, the policyholder pays the first $1,000 of a covered loss and the insurer covers the remainder up to the policy limit.",
    relatedTerms: ["premium", "coinsurance", "out-of-pocket-maximum", "copay"],
  },
  {
    id: "policy",
    name: "Policy",
    category: "General Insurance",
    definition:
      "A formal contract between the insured and the insurer that outlines the terms, conditions, coverage limits, exclusions, and premium obligations. The policy is the legally binding document that defines what is and is not covered.",
    relatedTerms: ["premium", "endorsement", "exclusion", "policyholder"],
  },
  {
    id: "policyholder",
    name: "Policyholder",
    category: "General Insurance",
    definition:
      "The individual or entity that owns an insurance policy. The policyholder is responsible for paying premiums and is the named insured on the policy contract. They may also be the beneficiary, although these roles can differ.",
    relatedTerms: ["policy", "beneficiary", "insured", "premium"],
  },
  {
    id: "insured",
    name: "Insured",
    category: "General Insurance",
    definition:
      "The person or entity covered by an insurance policy. The insured may be the same as the policyholder or a different party, such as a dependent or named employee listed under a group policy.",
    relatedTerms: ["policyholder", "beneficiary", "policy"],
  },
  {
    id: "underwriting",
    name: "Underwriting",
    category: "General Insurance",
    definition:
      "The process by which an insurer evaluates the risk of insuring a person or entity and determines the premium to charge. Underwriters assess factors such as medical history, lifestyle, occupation, and financial information to decide whether to offer coverage and at what price.",
    relatedTerms: ["premium", "risk", "actuarial", "exclusion"],
  },
  {
    id: "endorsement",
    name: "Endorsement",
    category: "General Insurance",
    definition:
      "An amendment or addition to an existing insurance policy that changes the terms, coverage, or conditions of the original contract. Endorsements can add coverage (e.g., a rider for flood damage) or restrict it, and must be agreed upon by both parties.",
    relatedTerms: ["policy", "rider", "exclusion"],
  },
  {
    id: "exclusion",
    name: "Exclusion",
    category: "General Insurance",
    definition:
      "A specific condition, circumstance, or type of loss that is not covered under an insurance policy. Common exclusions include pre-existing conditions, acts of war, intentional damage, and certain natural disasters. Exclusions are explicitly listed in the policy document.",
    relatedTerms: ["policy", "endorsement", "rider", "pre-existing-condition"],
  },
  {
    id: "risk",
    name: "Risk",
    category: "General Insurance",
    definition:
      "The probability and potential magnitude of financial loss that an insured event may cause. In insurance, risk refers both to the likelihood that a covered event will occur and to the exposure the insurer takes on by providing coverage.",
    relatedTerms: ["underwriting", "actuarial", "premium", "reinsurance"],
  },
  {
    id: "actuarial",
    name: "Actuarial",
    category: "General Insurance",
    definition:
      "Relating to the mathematical and statistical analysis used to assess risk and set premiums in insurance. Actuaries use mortality tables, probability models, and financial mathematics to estimate future claims and ensure an insurer remains financially solvent.",
    relatedTerms: ["risk", "underwriting", "ibnr", "loss-ratio"],
  },

  // ── Claims ─────────────────────────────────────────────────────────────────
  {
    id: "claim",
    name: "Claim",
    category: "Claims",
    definition:
      "A formal request submitted by the insured to the insurer for payment or services following a covered loss or event. The insurer reviews the claim against the policy terms to determine whether and how much to pay.",
    relatedTerms: ["claims-adjuster", "subrogation", "loss", "settlement"],
  },
  {
    id: "claims-adjuster",
    name: "Claims Adjuster",
    category: "Claims",
    definition:
      "A professional employed by or contracted for an insurance company to investigate, evaluate, and settle insurance claims. Adjusters verify coverage, assess damages, interview claimants, and negotiate settlements on behalf of the insurer.",
    relatedTerms: ["claim", "settlement", "subrogation"],
  },
  {
    id: "subrogation",
    name: "Subrogation",
    category: "Claims",
    definition:
      "The legal right of an insurer, after paying a claim, to step into the shoes of the insured and pursue recovery from the third party responsible for the loss. For example, if another driver causes an accident, the insurer can sue the at-fault driver after compensating the policyholder.",
    relatedTerms: ["claim", "indemnity", "third-party-liability"],
  },
  {
    id: "loss",
    name: "Loss",
    category: "Claims",
    definition:
      "The financial harm or damage suffered by the insured that triggers a claim under an insurance policy. A loss can be direct (physical damage) or indirect (business interruption, lost income). Insurers calculate the extent of the loss to determine the payout.",
    relatedTerms: ["claim", "loss-ratio", "indemnity", "settlement"],
  },
  {
    id: "loss-ratio",
    name: "Loss Ratio",
    category: "Claims",
    definition:
      "A financial metric calculated as total claims paid divided by total premiums earned, expressed as a percentage. A loss ratio above 100% means the insurer is paying out more in claims than it collects in premiums, indicating potential financial stress.",
    relatedTerms: ["loss", "premium", "combined-ratio", "actuarial"],
  },
  {
    id: "settlement",
    name: "Settlement",
    category: "Claims",
    definition:
      "The agreed-upon payment made by the insurer to the claimant to resolve an insurance claim. Settlements can be reached through negotiation, mediation, or litigation and represent the final resolution of a claim.",
    relatedTerms: ["claim", "claims-adjuster", "indemnity", "subrogation"],
  },
  {
    id: "indemnity",
    name: "Indemnity",
    category: "Claims",
    definition:
      "The principle that insurance restores the insured to their financial position before the loss occurred, without allowing profit from the insurance payout. Indemnity ensures the claimant is compensated for actual losses, not more.",
    relatedTerms: ["claim", "settlement", "subrogation", "loss"],
  },
  {
    id: "ibnr",
    name: "IBNR (Incurred But Not Reported)",
    category: "Claims",
    definition:
      "A reserve set aside by insurers for claims that have occurred but have not yet been formally reported. IBNR liabilities are estimated using actuarial methods and are critical for accurate financial reporting and solvency assessment.",
    relatedTerms: ["actuarial", "loss-ratio", "reserve", "claim"],
  },

  // ── Coverage ───────────────────────────────────────────────────────────────
  {
    id: "coinsurance",
    name: "Coinsurance",
    category: "Coverage",
    definition:
      "A cost-sharing arrangement where the insured pays a fixed percentage of covered healthcare costs after meeting the deductible. For example, with 20% coinsurance, the insurer pays 80% and the insured pays 20% of each covered service until the out-of-pocket maximum is reached.",
    relatedTerms: ["copay", "deductible", "out-of-pocket-maximum", "premium"],
  },
  {
    id: "copay",
    name: "Copay",
    category: "Coverage",
    definition:
      "A fixed dollar amount the insured pays for a specific covered service at the time of care, such as $30 for a doctor visit or $15 for a generic prescription. Unlike coinsurance, copays are flat fees and do not change based on the total cost of the service.",
    relatedTerms: ["coinsurance", "deductible", "out-of-pocket-maximum", "premium"],
  },
  {
    id: "out-of-pocket-maximum",
    name: "Out-of-Pocket Maximum",
    category: "Coverage",
    definition:
      "The most an insured will pay for covered healthcare services in a plan year. Once this limit is reached, the insurer covers 100% of covered costs. The out-of-pocket maximum includes deductibles, copays, and coinsurance but typically excludes premiums.",
    relatedTerms: ["deductible", "coinsurance", "copay", "premium"],
  },
  {
    id: "coverage-limit",
    name: "Coverage Limit",
    category: "Coverage",
    definition:
      "The maximum amount an insurance policy will pay for a covered loss or over the policy period. Limits can apply per occurrence, per year, or in aggregate. Losses exceeding the coverage limit must be paid by the insured.",
    relatedTerms: ["policy", "exclusion", "reinsurance", "umbrella-policy"],
  },
  {
    id: "umbrella-policy",
    name: "Umbrella Policy",
    category: "Coverage",
    definition:
      "A supplemental liability insurance policy that provides additional coverage beyond the limits of an underlying policy (e.g., auto or homeowners). Umbrella policies activate when the underlying policy's limits are exhausted and protect against large, unexpected claims.",
    relatedTerms: ["coverage-limit", "third-party-liability", "policy"],
  },
  {
    id: "third-party-liability",
    name: "Third-Party Liability",
    category: "Coverage",
    definition:
      "Coverage that protects the insured against claims made by a third party (not the insurer or the insured) for bodily injury or property damage caused by the insured's actions or negligence. This is the basis of most auto and general liability policies.",
    relatedTerms: ["umbrella-policy", "subrogation", "indemnity"],
  },
  {
    id: "pre-existing-condition",
    name: "Pre-existing Condition",
    category: "Coverage",
    definition:
      "A health condition that existed before the start date of a new insurance policy. Historically, insurers could deny coverage or charge higher premiums for pre-existing conditions. Under the ACA in the US, health insurers cannot deny coverage based on pre-existing conditions.",
    relatedTerms: ["exclusion", "underwriting", "waiting-period"],
  },
  {
    id: "waiting-period",
    name: "Waiting Period",
    category: "Coverage",
    definition:
      "A specified length of time after a policy's effective date during which certain benefits are not yet payable. For example, a dental policy may have a 6-month waiting period before covering orthodontic treatment, or a disability policy may require 90 days before benefit payments begin.",
    relatedTerms: ["pre-existing-condition", "policy", "exclusion"],
  },
  {
    id: "rider",
    name: "Rider",
    category: "Coverage",
    definition:
      "An optional add-on to an insurance policy that modifies or extends coverage, typically for an additional premium. Common riders include critical illness riders on life policies, maternity riders on health policies, or waiver-of-premium riders that suspend premium payments during disability.",
    relatedTerms: ["endorsement", "policy", "exclusion"],
  },

  // ── Life & Health ──────────────────────────────────────────────────────────
  {
    id: "beneficiary",
    name: "Beneficiary",
    category: "Life & Health",
    definition:
      "The person or entity designated to receive the death benefit or proceeds from a life insurance policy upon the death of the insured. Multiple beneficiaries can be named, with specified percentages of the payout allocated to each.",
    relatedTerms: ["policyholder", "insured", "life-insurance", "death-benefit"],
  },
  {
    id: "life-insurance",
    name: "Life Insurance",
    category: "Life & Health",
    definition:
      "A contract in which the insurer agrees to pay a specified sum (the death benefit) to the policyholder's named beneficiaries upon the insured's death. Life insurance provides financial protection for dependents and can also serve as a savings or investment vehicle (as with whole or universal life policies).",
    relatedTerms: ["beneficiary", "death-benefit", "term-life", "whole-life"],
  },
  {
    id: "term-life",
    name: "Term Life Insurance",
    category: "Life & Health",
    definition:
      "A type of life insurance that provides coverage for a specified period (e.g., 10, 20, or 30 years). If the insured dies during the term, the death benefit is paid to beneficiaries. If the insured outlives the term, the policy expires with no payout, and premiums are not returned.",
    relatedTerms: ["life-insurance", "whole-life", "death-benefit", "premium"],
  },
  {
    id: "whole-life",
    name: "Whole Life Insurance",
    category: "Life & Health",
    definition:
      "Permanent life insurance that provides coverage for the insured's entire lifetime, as long as premiums are paid. Whole life policies build cash value over time, which the policyholder can borrow against or withdraw. Premiums are typically higher than term life but remain fixed.",
    relatedTerms: ["term-life", "life-insurance", "cash-value", "premium"],
  },
  {
    id: "death-benefit",
    name: "Death Benefit",
    category: "Life & Health",
    definition:
      "The lump-sum payment made by a life insurance company to the beneficiary upon the death of the insured. Death benefits are generally income-tax-free and can be used by beneficiaries for any purpose, including paying debts, covering living expenses, or funding education.",
    relatedTerms: ["beneficiary", "life-insurance", "term-life", "whole-life"],
  },
  {
    id: "cash-value",
    name: "Cash Value",
    category: "Life & Health",
    definition:
      "The savings component of a permanent life insurance policy (such as whole life or universal life) that accumulates over time on a tax-deferred basis. Policyholders can borrow against the cash value, make partial withdrawals, or surrender the policy for its cash value.",
    relatedTerms: ["whole-life", "life-insurance", "premium", "surrender-value"],
  },
  {
    id: "surrender-value",
    name: "Surrender Value",
    category: "Life & Health",
    definition:
      "The amount a policyholder receives if they voluntarily cancel a permanent life insurance policy before its maturity or the insured's death. The surrender value equals the accumulated cash value minus any applicable surrender charges or outstanding loans.",
    relatedTerms: ["cash-value", "whole-life", "policyholder"],
  },

  // ── Reinsurance ────────────────────────────────────────────────────────────
  {
    id: "reinsurance",
    name: "Reinsurance",
    category: "Reinsurance",
    definition:
      "Insurance purchased by an insurance company from another insurer (the reinsurer) to transfer a portion of its risk exposure. Reinsurance protects primary insurers from large losses, stabilizes claims costs, and allows them to underwrite more policies than their capital alone would permit.",
    relatedTerms: ["retrocession", "treaty-reinsurance", "facultative-reinsurance", "risk"],
  },
  {
    id: "retrocession",
    name: "Retrocession",
    category: "Reinsurance",
    definition:
      "The practice by which a reinsurer cedes (transfers) a portion of the risk it has assumed from a primary insurer to another reinsurer. Retrocession is essentially 'reinsurance of reinsurance' and is used to further spread large or catastrophic risks across the global market.",
    relatedTerms: ["reinsurance", "cession", "treaty-reinsurance"],
  },
  {
    id: "treaty-reinsurance",
    name: "Treaty Reinsurance",
    category: "Reinsurance",
    definition:
      "A standing agreement between a primary insurer and a reinsurer under which the reinsurer automatically accepts a specified portion of all risks within a defined class underwritten by the primary insurer. This contrasts with facultative reinsurance, which covers individual risks on a case-by-case basis.",
    relatedTerms: ["reinsurance", "facultative-reinsurance", "retrocession", "cession"],
  },
  {
    id: "facultative-reinsurance",
    name: "Facultative Reinsurance",
    category: "Reinsurance",
    definition:
      "A type of reinsurance where the primary insurer submits individual risks to the reinsurer, which then decides whether or not to accept each one. Unlike treaty reinsurance, the reinsurer has discretion on each risk. Facultative reinsurance is typically used for large, unique, or high-hazard risks.",
    relatedTerms: ["reinsurance", "treaty-reinsurance", "underwriting", "risk"],
  },
  {
    id: "cession",
    name: "Cession",
    category: "Reinsurance",
    definition:
      "The portion of risk and premium that a primary insurer transfers (cedes) to a reinsurer. The ceding company (primary insurer) retains a share of the risk, while the remainder is ceded to the reinsurer in exchange for a portion of the premium.",
    relatedTerms: ["reinsurance", "retrocession", "treaty-reinsurance"],
  },
  {
    id: "reserve",
    name: "Reserve",
    category: "Reinsurance",
    definition:
      "Funds set aside by an insurer or reinsurer to pay anticipated future claims and obligations. Adequate reserves are a regulatory requirement and a key indicator of an insurer's financial health. Types include loss reserves, unearned premium reserves, and IBNR reserves.",
    relatedTerms: ["ibnr", "actuarial", "loss", "combined-ratio"],
  },
  {
    id: "combined-ratio",
    name: "Combined Ratio",
    category: "Reinsurance",
    definition:
      "A measure of profitability used in the insurance industry, calculated as the sum of the loss ratio and the expense ratio. A combined ratio below 100% indicates an underwriting profit; above 100% indicates an underwriting loss (though investment income can offset this).",
    relatedTerms: ["loss-ratio", "reserve", "actuarial", "premium"],
  },

  // ── Regulatory ─────────────────────────────────────────────────────────────
  {
    id: "solvency",
    name: "Solvency",
    category: "Regulatory",
    definition:
      "An insurer's ability to meet its long-term financial obligations, particularly the ability to pay all future claims. Regulators require insurers to maintain minimum capital and surplus levels (risk-based capital standards) to ensure solvency and protect policyholders.",
    relatedTerms: ["reserve", "risk-based-capital", "actuarial", "combined-ratio"],
  },
  {
    id: "risk-based-capital",
    name: "Risk-Based Capital (RBC)",
    category: "Regulatory",
    definition:
      "A regulatory framework that sets minimum capital requirements for insurers based on the types and magnitude of risks they carry. Insurers with insufficient risk-based capital relative to their exposure may face regulatory action, including mandatory corrective plans or insolvency proceedings.",
    relatedTerms: ["solvency", "reserve", "actuarial", "regulatory-filing"],
  },
  {
    id: "regulatory-filing",
    name: "Regulatory Filing",
    category: "Regulatory",
    definition:
      "Documents submitted by insurers to state or national insurance regulators, including rate filings, form filings, financial statements, and annual reports. Regulators review these filings to ensure compliance with laws governing premium rates, policy language, and financial stability.",
    relatedTerms: ["solvency", "risk-based-capital", "admitted-insurer"],
  },
  {
    id: "admitted-insurer",
    name: "Admitted Insurer",
    category: "Regulatory",
    definition:
      "An insurance company that has been licensed and approved by the state insurance department to sell insurance in that state. Admitted insurers are subject to state regulation, including rate approval and participation in the state's guaranty fund, which protects policyholders if the insurer becomes insolvent.",
    relatedTerms: ["surplus-lines", "regulatory-filing", "solvency"],
  },
  {
    id: "surplus-lines",
    name: "Surplus Lines",
    category: "Regulatory",
    definition:
      "Insurance coverage obtained from a non-admitted insurer (one not licensed in the state) when coverage cannot be obtained from the admitted market. Surplus lines insurers are generally not subject to state rate and form regulations but must still comply with surplus lines laws, and the policies are not covered by the state guaranty fund.",
    relatedTerms: ["admitted-insurer", "regulatory-filing", "risk"],
  },
  {
    id: "guaranty-fund",
    name: "Guaranty Fund",
    category: "Regulatory",
    definition:
      "A state-mandated fund, financed by assessments on admitted insurers, that pays claims to policyholders if a licensed insurance company becomes insolvent and cannot meet its obligations. Guaranty funds protect consumers but have coverage limits and do not apply to surplus lines policies.",
    relatedTerms: ["admitted-insurer", "solvency", "reserve"],
  },
];

export const CATEGORIES: Category[] = [
  "General Insurance",
  "Claims",
  "Coverage",
  "Life & Health",
  "Reinsurance",
  "Regulatory",
];
