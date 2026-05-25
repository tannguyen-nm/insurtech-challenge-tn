"""Main pipeline: load → detect → score → output."""
import json, time
import pandas as pd
from rules import run_all_rules
from scorer import score_claim

SCORE_THRESHOLD = 10   # claims at or above this are classified as fraud


def run(csv_path: str = 'claims_raw.csv',
        output_path: str = 'scored_claims.json',
        labels_path: str | None = 'claims_labels.csv',
        metrics_path: str = 'metrics_report.txt') -> list:

    t0 = time.time()
    df = pd.read_csv(csv_path)
    # CSV stores 'True'/'False' strings — astype(bool) on a string is always True
    df['is_weekend'] = df['is_weekend'].map({'True': True, 'False': False, True: True, False: False})

    all_flags = run_all_rules(df)

    results = []
    for cid, flags in all_flags.items():
        results.append({
            'claim_id': cid,
            'risk_score': score_claim(flags),
            'flags': flags,
        })

    results.sort(key=lambda r: r['risk_score'], reverse=True)

    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    elapsed = time.time() - t0
    print(f'Scored {len(results)} claims in {elapsed:.2f}s → {output_path}')

    if labels_path:
        _report_metrics(results, labels_path, metrics_path)

    return results


def _report_metrics(results: list, labels_path: str, metrics_path: str):
    labels = pd.read_csv(labels_path).set_index('claim_id')['is_fraud'].to_dict()
    scored = {r['claim_id']: r['risk_score'] for r in results}

    TP = FP = TN = FN = 0
    for cid, score in scored.items():
        actual = labels.get(cid, False)
        predicted = score >= SCORE_THRESHOLD
        if predicted and actual:     TP += 1
        elif predicted and not actual: FP += 1
        elif not predicted and actual: FN += 1
        else:                          TN += 1

    precision = TP / (TP + FP) if (TP + FP) else 0
    recall    = TP / (TP + FN) if (TP + FN) else 0
    fpr       = FP / (FP + TN) if (FP + TN) else 0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0

    # Breakdown by rule
    rule_hits: dict[str, int] = {}
    for r in results:
        if labels.get(r['claim_id']):
            for f in r['flags']:
                rule_hits[f['rule']] = rule_hits.get(f['rule'], 0) + 1

    report = (
        f"=== Fraud Detection Metrics (threshold ≥ {SCORE_THRESHOLD}) ===\n\n"
        f"  True Positives  : {TP}\n"
        f"  False Positives : {FP}\n"
        f"  True Negatives  : {TN}\n"
        f"  False Negatives : {FN}\n\n"
        f"  Precision  : {precision*100:.1f}%\n"
        f"  Recall     : {recall*100:.1f}%   (target ≥ 70%)\n"
        f"  FP Rate    : {fpr*100:.1f}%   (target ≤ 20%)\n"
        f"  F1 Score   : {f1*100:.1f}%\n\n"
        f"=== Rule coverage on known fraud ===\n"
    )
    for rule, cnt in sorted(rule_hits.items(), key=lambda x: -x[1]):
        report += f"  {rule:<30}: {cnt}\n"

    print(report)
    with open(metrics_path, 'w') as f:
        f.write(report)


if __name__ == '__main__':
    run()
