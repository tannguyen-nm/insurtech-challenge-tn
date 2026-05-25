"""15+ unit tests for all 8 fraud detection rules and scoring."""
import json
import pandas as pd
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from rules import (
    rule_duplicate, rule_rapid_resubmission, rule_upcoding,
    rule_unbundling, rule_phantom_billing, rule_weekend_anomaly,
    rule_dx_proc_mismatch, rule_amount_clustering,
    BUNDLES, VALID_DX_PROC,
)
from scorer import score_claim


# ── Helpers ───────────────────────────────────────────────────────────────────
def make_df(rows: list[dict]) -> pd.DataFrame:
    defaults = dict(claim_id='C-001', member_id='M-001', provider_id='P-001',
                    provider_name='Test Clinic', claim_date='2024-01-10',
                    claim_type='OUTPATIENT', diagnosis_code='J06.9',
                    procedure_codes=json.dumps(['P-0100']),
                    submitted_amount=5000.0, is_weekend=False)
    return pd.DataFrame([{**defaults, **r} for r in rows])


# ── Rule 1: Duplicate claim ───────────────────────────────────────────────────
def test_duplicate_triggers():
    df = make_df([
        dict(claim_id='C-001', member_id='M-1', provider_id='P-1', claim_date='2024-03-01', diagnosis_code='I10'),
        dict(claim_id='C-002', member_id='M-1', provider_id='P-1', claim_date='2024-03-01', diagnosis_code='I10'),
    ])
    result = rule_duplicate(df)
    assert 'C-001' in result and 'C-002' in result

def test_duplicate_not_triggered_single():
    df = make_df([dict(claim_id='C-001')])
    assert rule_duplicate(df) == {}

def test_duplicate_different_date_no_flag():
    df = make_df([
        dict(claim_id='C-001', member_id='M-1', claim_date='2024-01-01', diagnosis_code='I10'),
        dict(claim_id='C-002', member_id='M-1', claim_date='2024-01-02', diagnosis_code='I10'),
    ])
    assert rule_duplicate(df) == {}


# ── Rule 2: Rapid re-submission ───────────────────────────────────────────────
def test_rapid_resubmission_triggers():
    df = make_df([
        dict(claim_id='C-001', member_id='M-1', diagnosis_code='I10', claim_date='2024-01-01'),
        dict(claim_id='C-002', member_id='M-1', diagnosis_code='I10', claim_date='2024-01-05'),
    ])
    result = rule_rapid_resubmission(df)
    assert 'C-002' in result
    assert '4' in result['C-002']['evidence']  # 4 days apart

def test_rapid_resubmission_8_days_no_flag():
    df = make_df([
        dict(claim_id='C-001', member_id='M-1', diagnosis_code='I10', claim_date='2024-01-01'),
        dict(claim_id='C-002', member_id='M-1', diagnosis_code='I10', claim_date='2024-01-09'),
    ])
    assert rule_rapid_resubmission(df) == {}


# ── Rule 3: Upcoding ─────────────────────────────────────────────────────────
def test_upcoding_triggers():
    rows = [dict(claim_id=f'C-{i:03d}', procedure_codes=json.dumps(['P-0100']),
                 submitted_amount=1000.0) for i in range(10)]
    rows.append(dict(claim_id='C-HIGH', procedure_codes=json.dumps(['P-0100']),
                     submitted_amount=50_000.0))
    df = make_df(rows)
    result = rule_upcoding(df)
    assert 'C-HIGH' in result
    assert '2.' in result['C-HIGH']['evidence'] or 'std' in result['C-HIGH']['evidence']

def test_upcoding_insufficient_samples_no_flag():
    # < 5 samples → skip
    rows = [dict(claim_id=f'C-{i:03d}', procedure_codes=json.dumps(['P-RARE']),
                 submitted_amount=float(1000 + i * 100)) for i in range(4)]
    df = make_df(rows)
    assert rule_upcoding(df) == {}


# ── Rule 4: Unbundling ────────────────────────────────────────────────────────
def test_unbundling_triggers():
    components = sorted(BUNDLES['BUNDLE-01'])
    df = make_df([dict(claim_id='C-001', procedure_codes=json.dumps(components))])
    result = rule_unbundling(df)
    assert 'C-001' in result
    assert 'BUNDLE-01' in result['C-001']['evidence']

def test_unbundling_partial_no_flag():
    partial = list(BUNDLES['BUNDLE-01'])[:2]  # only 2 of 3 → no flag
    df = make_df([dict(claim_id='C-001', procedure_codes=json.dumps(partial))])
    assert rule_unbundling(df) == {}


# ── Rule 5: Phantom billing ───────────────────────────────────────────────────
def test_phantom_billing_triggers_above_30():
    rows = [dict(claim_id=f'C-{i:03d}', provider_id='P-PHNT',
                 claim_date='2024-06-01') for i in range(31)]
    df = make_df(rows)
    result = rule_phantom_billing(df)
    assert len(result) == 31

def test_phantom_billing_exactly_30_no_flag():
    rows = [dict(claim_id=f'C-{i:03d}', provider_id='P-PHNT',
                 claim_date='2024-06-01') for i in range(30)]
    df = make_df(rows)
    assert rule_phantom_billing(df) == {}


# ── Rule 6: Weekend anomaly ───────────────────────────────────────────────────
def test_weekend_anomaly_triggers():
    # 1 weekend surgical claim + 99 weekday normal → rate = 1/100 = 1% < 5%
    rows = [dict(claim_id=f'W-{i:03d}', provider_id='P-SURG',
                 claim_date='2024-01-08', is_weekend=False,  # Monday
                 procedure_codes=json.dumps(['P-0100'])) for i in range(99)]
    rows.append(dict(claim_id='W-FRAUD', provider_id='P-SURG',
                     claim_date='2024-01-06', is_weekend=True,
                     procedure_codes=json.dumps(['S-0300'])))
    df = make_df(rows)
    result = rule_weekend_anomaly(df)
    assert 'W-FRAUD' in result

def test_weekend_anomaly_high_weekend_rate_no_flag():
    # 50% weekend rate → no flag
    rows = []
    for i in range(5):
        rows.append(dict(claim_id=f'WD-{i}', provider_id='P-X', is_weekend=False,
                         procedure_codes=json.dumps(['P-0100'])))
        rows.append(dict(claim_id=f'WE-{i}', provider_id='P-X', is_weekend=True,
                         procedure_codes=json.dumps(['S-0300'])))
    df = make_df(rows)
    result = rule_weekend_anomaly(df)
    assert all('P-X' not in v['evidence'] for v in result.values()) or result == {}


# ── Rule 7: Diagnosis-procedure mismatch ─────────────────────────────────────
def test_dx_proc_mismatch_triggers():
    # J06.9 valid procs: P-0100, P-0101, P-0102 — use P-0200 (invalid)
    df = make_df([dict(claim_id='C-001', diagnosis_code='J06.9',
                       procedure_codes=json.dumps(['P-0200']))])
    result = rule_dx_proc_mismatch(df)
    assert 'C-001' in result

def test_dx_proc_mismatch_valid_pair_no_flag():
    df = make_df([dict(claim_id='C-001', diagnosis_code='J06.9',
                       procedure_codes=json.dumps(['P-0100']))])
    assert rule_dx_proc_mismatch(df) == {}

def test_dx_proc_mismatch_unknown_dx_no_flag():
    df = make_df([dict(claim_id='C-001', diagnosis_code='Z99.99',
                       procedure_codes=json.dumps(['P-0200']))])
    assert rule_dx_proc_mismatch(df) == {}


# ── Rule 8: Amount clustering ─────────────────────────────────────────────────
def test_amount_clustering_triggers_at_lower_bound():
    df = make_df([dict(claim_id='C-001', submitted_amount=47_500.0)])
    assert 'C-001' in rule_amount_clustering(df)

def test_amount_clustering_triggers_just_below_threshold():
    df = make_df([dict(claim_id='C-001', submitted_amount=49_999.0)])
    assert 'C-001' in rule_amount_clustering(df)

def test_amount_clustering_at_threshold_no_flag():
    df = make_df([dict(claim_id='C-001', submitted_amount=50_000.0)])
    assert rule_amount_clustering(df) == {}

def test_amount_clustering_below_range_no_flag():
    df = make_df([dict(claim_id='C-001', submitted_amount=47_499.0)])
    assert rule_amount_clustering(df) == {}


# ── Scoring ───────────────────────────────────────────────────────────────────
def test_score_no_flags():
    assert score_claim([]) == 0

def test_score_single_duplicate():
    flags = [{'rule': 'duplicate_claim', 'severity': 5}]
    assert score_claim(flags) > 0

def test_score_multiple_flags_higher_than_single():
    one = score_claim([{'rule': 'duplicate_claim', 'severity': 5}])
    two = score_claim([{'rule': 'duplicate_claim', 'severity': 5},
                       {'rule': 'upcoding', 'severity': 4}])
    assert two > one

def test_score_capped_at_100():
    flags = [{'rule': r, 'severity': 5} for r in
             ['duplicate_claim','phantom_billing','upcoding','weekend_anomaly',
              'dx_proc_mismatch','rapid_resubmission','unbundling','amount_clustering']]
    assert score_claim(flags) <= 100
