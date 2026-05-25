"""8 fraud detection rules. Each returns a list of RuleFlag dicts."""
import json
import pandas as pd

AUTO_THRESHOLD = 50_000
CLUSTER_LOW = 47_500

SURGICAL_PREFIX = 'S-'

BUNDLES = {
    'BUNDLE-01': frozenset(['P-0100', 'P-0101', 'P-0102']),
    'BUNDLE-02': frozenset(['P-0103', 'P-0104', 'P-0105']),
    'BUNDLE-03': frozenset(['P-0106', 'P-0107', 'P-0108']),
    'BUNDLE-04': frozenset(['P-0109', 'P-0110', 'P-0111']),
    'BUNDLE-05': frozenset(['P-0112', 'P-0113', 'P-0114']),
}

VALID_DX_PROC = {
    'J06.9':   {'P-0100','P-0101','P-0102'},
    'K21.0':   {'P-0103','P-0104'},
    'M54.5':   {'P-0105','P-0106','S-0300'},
    'J45.909': {'P-0107','P-0108'},
    'I10':     {'P-0109','P-0110'},
    'E11.9':   {'P-0111','P-0112'},
    'K29.70':  {'P-0113','P-0114'},
    'N39.0':   {'P-0115','P-0116'},
    'J18.9':   {'P-0117','P-0118','S-0301'},
    'M79.3':   {'P-0119','P-0120','S-0302'},
}


def _parse_procs(val) -> list:
    if isinstance(val, list):
        return val
    try:
        return json.loads(val)
    except Exception:
        return [val] if val else []


# ── Rule 1: Duplicate claim ───────────────────────────────────────────────────
def rule_duplicate(df: pd.DataFrame) -> dict:
    key = ['member_id', 'provider_id', 'claim_date', 'diagnosis_code']
    counts = df.groupby(key)['claim_id'].transform('count')
    flagged = {}
    for _, row in df[counts > 1].iterrows():
        flagged[row['claim_id']] = {
            'rule': 'duplicate_claim', 'severity': 5,
            'evidence': (f"Duplicate: member {row['member_id']} + provider {row['provider_id']} "
                         f"+ date {row['claim_date']} + diagnosis {row['diagnosis_code']} appears multiple times"),
        }
    return flagged


# ── Rule 2: Rapid re-submission ───────────────────────────────────────────────
def rule_rapid_resubmission(df: pd.DataFrame) -> dict:
    flagged = {}
    df2 = df[['claim_id','member_id','diagnosis_code','claim_date']].copy()
    df2['claim_date'] = pd.to_datetime(df2['claim_date'])
    df2 = df2.sort_values(['member_id','diagnosis_code','claim_date'])
    df2['prev_date'] = df2.groupby(['member_id','diagnosis_code'])['claim_date'].shift(1)
    df2['days_since'] = (df2['claim_date'] - df2['prev_date']).dt.days
    for _, row in df2[df2['days_since'].between(1, 6, inclusive='both')].iterrows():
        flagged[row['claim_id']] = {
            'rule': 'rapid_resubmission', 'severity': 3,
            'evidence': (f"Same member {row['member_id']} + diagnosis {row['diagnosis_code']} "
                         f"resubmitted {int(row['days_since'])} day(s) after previous claim"),
        }
    return flagged


# ── Rule 3: Upcoding ─────────────────────────────────────────────────────────
def rule_upcoding(df: pd.DataFrame) -> dict:
    flagged = {}
    df2 = df.copy()
    df2['_procs'] = df2['procedure_codes'].apply(_parse_procs)
    df2['_primary_proc'] = df2['_procs'].apply(lambda p: p[0] if p else None)
    stats = df2.groupby('_primary_proc')['submitted_amount'].agg(['mean','std','count'])
    stats = stats[stats['count'] >= 5]
    merged = df2.merge(stats, left_on='_primary_proc', right_index=True, how='left')
    for _, row in merged.dropna(subset=['mean','std']).iterrows():
        if row['std'] > 0:
            z = (row['submitted_amount'] - row['mean']) / row['std']
            if z > 2:
                flagged[row['claim_id']] = {
                    'rule': 'upcoding', 'severity': 4,
                    'evidence': (f"Amount {row['submitted_amount']:,.0f} for procedure {row['_primary_proc']} "
                                 f"is {z:.1f} std deviations above mean {row['mean']:,.0f}"),
                }
    return flagged


# ── Rule 4: Unbundling ────────────────────────────────────────────────────────
def rule_unbundling(df: pd.DataFrame) -> dict:
    flagged = {}
    for _, row in df.iterrows():
        procs = frozenset(_parse_procs(row['procedure_codes']))
        for bundle_name, components in BUNDLES.items():
            if components.issubset(procs):
                flagged[row['claim_id']] = {
                    'rule': 'unbundling', 'severity': 3,
                    'evidence': (f"Procedures {sorted(components)} are individual components of "
                                 f"{bundle_name} and should be billed as a single bundled code"),
                }
                break
    return flagged


# ── Rule 5: Phantom billing ───────────────────────────────────────────────────
def rule_phantom_billing(df: pd.DataFrame) -> dict:
    flagged = {}
    daily = df.groupby(['provider_id','claim_date'])['claim_id'].transform('count')
    for _, row in df[daily > 30].iterrows():
        cnt = daily.loc[row.name]
        flagged[row['claim_id']] = {
            'rule': 'phantom_billing', 'severity': 5,
            'evidence': (f"Provider {row['provider_id']} ({row['provider_name']}) submitted "
                         f"{cnt} claims on {row['claim_date']} (threshold: 30)"),
        }
    return flagged


# ── Rule 6: Weekend anomaly ───────────────────────────────────────────────────
def rule_weekend_anomaly(df: pd.DataFrame) -> dict:
    flagged = {}
    df2 = df.copy()
    df2['_procs'] = df2['procedure_codes'].apply(_parse_procs)
    df2['_is_surgical'] = df2['_procs'].apply(lambda ps: any(p.startswith(SURGICAL_PREFIX) for p in ps))

    total_by_prov = df2.groupby('provider_id').size()
    wknd_by_prov  = df2[df2['is_weekend']].groupby('provider_id').size()
    wknd_rate = (wknd_by_prov / total_by_prov).fillna(0)

    for _, row in df2[df2['is_weekend'] & df2['_is_surgical']].iterrows():
        rate = wknd_rate.get(row['provider_id'], 0)
        if rate < 0.05:
            flagged[row['claim_id']] = {
                'rule': 'weekend_anomaly', 'severity': 4,
                'evidence': (f"Surgical procedure on weekend for provider {row['provider_id']} "
                             f"whose historical weekend rate is {rate*100:.1f}% (threshold: 5%)"),
            }
    return flagged


# ── Rule 7: Diagnosis-procedure mismatch ─────────────────────────────────────
def rule_dx_proc_mismatch(df: pd.DataFrame) -> dict:
    flagged = {}
    for _, row in df.iterrows():
        dx = row['diagnosis_code']
        if dx not in VALID_DX_PROC:
            continue
        valid = VALID_DX_PROC[dx]
        procs = _parse_procs(row['procedure_codes'])
        mismatched = [p for p in procs if p not in valid]
        if mismatched:
            flagged[row['claim_id']] = {
                'rule': 'dx_proc_mismatch', 'severity': 4,
                'evidence': (f"Procedure(s) {mismatched} not clinically associated with "
                             f"diagnosis {dx} (valid: {sorted(valid)})"),
            }
    return flagged


# ── Rule 8: Amount clustering ─────────────────────────────────────────────────
def rule_amount_clustering(df: pd.DataFrame, threshold: float = AUTO_THRESHOLD) -> dict:
    flagged = {}
    low = threshold * 0.95
    for _, row in df[(df['submitted_amount'] >= low) & (df['submitted_amount'] < threshold)].iterrows():
        pct = row['submitted_amount'] / threshold * 100
        flagged[row['claim_id']] = {
            'rule': 'amount_clustering', 'severity': 2,
            'evidence': (f"Amount {row['submitted_amount']:,.0f} is {pct:.1f}% of the "
                         f"{threshold:,.0f} auto-approval threshold (range: {low:,.0f}–{threshold:,.0f})"),
        }
    return flagged


# ── Run all rules ─────────────────────────────────────────────────────────────
def run_all_rules(df: pd.DataFrame) -> dict[str, list]:
    """Returns {claim_id: [flag, ...]}"""
    all_flags: dict[str, list] = {cid: [] for cid in df['claim_id']}

    for rule_fn in [
        rule_duplicate, rule_rapid_resubmission, rule_upcoding,
        rule_unbundling, rule_phantom_billing, rule_weekend_anomaly,
        rule_dx_proc_mismatch, rule_amount_clustering,
    ]:
        for cid, flag in rule_fn(df).items():
            all_flags[cid].append(flag)

    return all_flags
