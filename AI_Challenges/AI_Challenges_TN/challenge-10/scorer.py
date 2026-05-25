"""Composite risk scorer. Severity weights justified in README."""

# Weights reflect signal strength and fraud certainty:
# - duplicate/phantom = definitive fraud patterns → 5
# - upcoding/weekend/mismatch = strong statistical/clinical evidence → 4
# - rapid_resubmission/unbundling = indicative but legitimately explainable → 3
# - amount_clustering = weak alone (could be coincidence) → 2
SEVERITY_WEIGHTS = {
    'duplicate_claim':     5,
    'phantom_billing':     5,
    'upcoding':            4,
    'weekend_anomaly':     4,
    'dx_proc_mismatch':    4,
    'rapid_resubmission':  3,
    'unbundling':          3,
    'amount_clustering':   2,
}

MAX_POSSIBLE = sum(SEVERITY_WEIGHTS.values())  # 30 — used for normalization


def score_claim(flags: list) -> int:
    """0–100 composite score, capped at 100."""
    if not flags:
        return 0
    total = sum(SEVERITY_WEIGHTS.get(f['rule'], f.get('severity', 1)) for f in flags)
    return min(100, round(total / MAX_POSSIBLE * 100))
