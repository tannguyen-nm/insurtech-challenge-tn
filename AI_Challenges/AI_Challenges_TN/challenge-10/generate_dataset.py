"""Generate claims_raw.csv and claims_labels.csv with ~200 embedded fraud claims."""
import csv, random, json
from datetime import date, timedelta

random.seed(99)

# ── Config ────────────────────────────────────────────────────────────────────
N_CLAIMS    = 2000
N_MEMBERS   = 500
N_PROVIDERS = 50
AUTO_THRESHOLD = 50_000

CLAIM_TYPES = ['OUTPATIENT', 'OUTPATIENT', 'OUTPATIENT', 'INPATIENT', 'DENTAL']
ICD10 = ['J06.9','K21.0','M54.5','J45.909','I10','E11.9','K29.70',
         'N39.0','J18.9','M79.3','Z00.00','R05','G43.909','K57.30',
         'L30.9','M25.511','I25.10','E78.5','R51','J30.9']
PROCEDURES_OP  = [f'P-{i:04d}' for i in range(100,130)]   # outpatient/dental
PROCEDURES_IP  = [f'P-{i:04d}' for i in range(200,230)]   # inpatient
PROCEDURES_SRG = [f'S-{i:04d}' for i in range(300,330)]   # surgical (S- prefix)

PROVIDERS = [f'PRV-{i:03d}' for i in range(1, N_PROVIDERS+1)]
# PRV-099 is the weekend-anomaly provider — deliberately excluded from random pool
WEEKEND_PROVIDER = 'PRV-099'
PROVIDER_NAMES = {p: f'Clinic {chr(65+(i%26))}{i//26+1}' for i, p in enumerate(PROVIDERS)}
PROVIDER_NAMES[WEEKEND_PROVIDER] = 'Surgical Clinic X'
MEMBERS = [f'MBR-{i:04d}' for i in range(1, N_MEMBERS+1)]

# ── Procedure bundles (unbundling rule) ───────────────────────────────────────
BUNDLES = {
    'BUNDLE-01': ['P-0100', 'P-0101', 'P-0102'],
    'BUNDLE-02': ['P-0103', 'P-0104', 'P-0105'],
    'BUNDLE-03': ['P-0106', 'P-0107', 'P-0108'],
    'BUNDLE-04': ['P-0109', 'P-0110', 'P-0111'],
    'BUNDLE-05': ['P-0112', 'P-0113', 'P-0114'],
}

# ── Valid diagnosis–procedure pairs (mismatch rule) ───────────────────────────
VALID_DX_PROC = {
    'J06.9':   ['P-0100','P-0101','P-0102'],
    'K21.0':   ['P-0103','P-0104'],
    'M54.5':   ['P-0105','P-0106','S-0300'],
    'J45.909': ['P-0107','P-0108'],
    'I10':     ['P-0109','P-0110'],
    'E11.9':   ['P-0111','P-0112'],
    'K29.70':  ['P-0113','P-0114'],
    'N39.0':   ['P-0115','P-0116'],
    'J18.9':   ['P-0117','P-0118','S-0301'],
    'M79.3':   ['P-0119','P-0120','S-0302'],
}
# Any diagnosis not listed above → procedure choices are free (no mismatch embeds)
DX_WITH_RULES = set(VALID_DX_PROC.keys())

def rand_date(start=date(2024,1,1), end=date(2024,12,31)):
    return start + timedelta(days=random.randint(0, (end-start).days))

def rand_amount(ctype):
    if ctype == 'INPATIENT':
        return round(random.uniform(10_000, 200_000), 2)
    elif ctype == 'DENTAL':
        return round(random.uniform(500, 8_000), 2)
    return round(random.uniform(500, 15_000), 2)

def rand_procs(ctype, diag=None):
    """Pick a valid procedure for the given claim type and diagnosis."""
    if diag and diag in VALID_DX_PROC:
        return [random.choice(list(VALID_DX_PROC[diag]))]
    pool = PROCEDURES_IP if ctype == 'INPATIENT' else PROCEDURES_OP
    # avoid procedures used in fraud mismatch pairs (P-0200..P-0209)
    safe = [p for p in pool if p not in {f'P-{i:04d}' for i in range(200,210)}]
    return [random.choice(safe)]

# ── Build normal claims ───────────────────────────────────────────────────────
claims = []
fraud_ids = set()
cid = 1

def new_claim(cid, member, provider, d, ctype, diag, procs, amount, fraud=False):
    is_wknd = d.weekday() >= 5
    return dict(
        claim_id=f'CLM-{cid:05d}',
        member_id=member,
        provider_id=provider,
        provider_name=PROVIDER_NAMES[provider],
        claim_date=d.isoformat(),
        claim_type=ctype,
        diagnosis_code=diag,
        procedure_codes=json.dumps(procs),
        submitted_amount=amount,
        is_weekend=is_wknd,
        _fraud=fraud,
    )

# 1. Normal claims (will be filled up at end)
def make_normal(cid):
    ctype = random.choice(CLAIM_TYPES)
    diag  = random.choice(ICD10)
    return new_claim(
        cid,
        random.choice(MEMBERS),
        random.choice(PROVIDERS),
        rand_date(),
        ctype,
        diag,
        rand_procs(ctype, diag),
        rand_amount(ctype),
    )

# ── Embed fraud patterns ───────────────────────────────────────────────────────

# 2. Duplicate claims (30): same member+provider+date+diagnosis, different claim_id
dup_bases = []
for _ in range(15):
    m, p, d, dx = random.choice(MEMBERS), random.choice(PROVIDERS[:20]), rand_date(), random.choice(ICD10)
    ctype = 'OUTPATIENT'
    procs = rand_procs(ctype)
    amt   = rand_amount(ctype)
    for _ in range(2):
        c = new_claim(cid, m, p, d, ctype, dx, procs, amt, fraud=True)
        claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 3. Rapid re-submissions (30)
for _ in range(15):
    m = random.choice(MEMBERS)
    p = random.choice(PROVIDERS)
    d1 = rand_date(end=date(2024,12,24))
    d2 = d1 + timedelta(days=random.randint(1,6))
    dx = random.choice(ICD10)
    for d in [d1, d2]:
        c = new_claim(cid, m, p, d, 'OUTPATIENT', dx, rand_procs('OUTPATIENT'), rand_amount('OUTPATIENT'), fraud=True)
        claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 4. Upcoded claims (30): amount > mean + 2*std for a procedure
# Use procedure P-0100, assume normal mean ~3000, std ~500 → upcoded = >4000+
for _ in range(30):
    amt = random.uniform(25_000, 45_000)   # well above typical OP range → triggers upcoding
    c = new_claim(cid, random.choice(MEMBERS), random.choice(PROVIDERS),
                  rand_date(), 'OUTPATIENT', random.choice(ICD10), ['P-0100'], amt, fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 5. Unbundled claims (25)
bundle_keys = list(BUNDLES.keys())
for _ in range(25):
    bkey = random.choice(bundle_keys)
    procs = BUNDLES[bkey][:]           # all individual components
    c = new_claim(cid, random.choice(MEMBERS), random.choice(PROVIDERS),
                  rand_date(), 'OUTPATIENT', random.choice(ICD10), procs,
                  rand_amount('OUTPATIENT'), fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 6. Phantom billing (25): PRV-001 submits >30 claims on one day
phantom_day = date(2024, 6, 15)
phantom_provider = 'PRV-001'
for i in range(25):
    c = new_claim(cid, MEMBERS[i % len(MEMBERS)], phantom_provider,
                  phantom_day, 'OUTPATIENT', random.choice(ICD10),
                  rand_procs('OUTPATIENT'), rand_amount('OUTPATIENT'), fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# Also add 10 normal claims to same provider+day to push count > 30
for i in range(10):
    c = new_claim(cid, MEMBERS[(i+50) % len(MEMBERS)], phantom_provider,
                  phantom_day, 'OUTPATIENT', random.choice(ICD10),
                  rand_procs('OUTPATIENT'), rand_amount('OUTPATIENT'), fraud=False)
    claims.append(c); cid += 1

# 7. Weekend anomalies (20): PRV-099 (never in random pool) — surgical on weekend
surgical_procs = PROCEDURES_SRG[:5]
for _ in range(20):
    wd = rand_date()
    while wd.weekday() < 5:
        wd = rand_date()
    c = new_claim(cid, random.choice(MEMBERS), WEEKEND_PROVIDER,
                  wd, 'INPATIENT', random.choice(ICD10),
                  [random.choice(surgical_procs)],
                  rand_amount('INPATIENT'), fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 8. Diagnosis-procedure mismatches (20)
mismatch_pairs = [
    ('J06.9',   'P-0200'),   # J06.9 valid: P-010x, NOT P-02xx
    ('K21.0',   'P-0201'),
    ('M54.5',   'P-0202'),
    ('J45.909', 'P-0203'),
    ('I10',     'P-0204'),
    ('E11.9',   'P-0205'),
    ('K29.70',  'P-0206'),
    ('N39.0',   'P-0207'),
    ('J18.9',   'P-0208'),
    ('M79.3',   'P-0209'),
]
for i in range(20):
    dx, proc = mismatch_pairs[i % len(mismatch_pairs)]
    c = new_claim(cid, random.choice(MEMBERS), random.choice(PROVIDERS),
                  rand_date(), 'OUTPATIENT', dx, [proc],
                  rand_amount('OUTPATIENT'), fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# 9. Amount clustering (20): 47500–49999
for _ in range(20):
    amt = round(random.uniform(47_500, 49_999), 2)
    c = new_claim(cid, random.choice(MEMBERS), random.choice(PROVIDERS),
                  rand_date(), 'OUTPATIENT', random.choice(ICD10),
                  rand_procs('OUTPATIENT'), amt, fraud=True)
    claims.append(c); fraud_ids.add(c['claim_id']); cid += 1

# ── Fill remaining normal claims ───────────────────────────────────────────────
# PRV-099 weekday baseline: 20_wknd/(20+N) < 0.05 → N > 380. Use 400 to be safe.
for _ in range(400):
    wd = rand_date()
    while wd.weekday() >= 5:
        wd = rand_date()
    diag = random.choice(ICD10)
    c = new_claim(cid, random.choice(MEMBERS), WEEKEND_PROVIDER,
                  wd, 'INPATIENT', diag,
                  rand_procs('INPATIENT', diag), rand_amount('INPATIENT'))
    claims.append(c); cid += 1

# Fill normal claims + normal phantom-day claims for PRV-001 to >30 total
for _ in range(5):
    diag = random.choice(ICD10)
    c = new_claim(cid, random.choice(MEMBERS), 'PRV-001',
                  phantom_day, 'OUTPATIENT', diag,
                  rand_procs('OUTPATIENT', diag), rand_amount('OUTPATIENT'))
    claims.append(c); cid += 1

while len(claims) < N_CLAIMS:
    claims.append(make_normal(cid)); cid += 1

random.shuffle(claims)

# ── Write CSV ─────────────────────────────────────────────────────────────────
BASE = '/Users/lazy/Documents/code/insurtech-challenge-tn/AI_Challenges/AI_Challenges_TN/challenge-10'

with open(f'{BASE}/claims_raw.csv', 'w', newline='') as f:
    cols = ['claim_id','member_id','provider_id','provider_name','claim_date',
            'claim_type','diagnosis_code','procedure_codes','submitted_amount','is_weekend']
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for c in claims:
        w.writerow({k: c[k] for k in cols})

with open(f'{BASE}/claims_labels.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['claim_id','is_fraud'])
    w.writeheader()
    for c in claims:
        w.writerow({'claim_id': c['claim_id'], 'is_fraud': c['_fraud']})

total_fraud = sum(1 for c in claims if c['_fraud'])
print(f'Total claims : {len(claims)}')
print(f'Fraud claims : {total_fraud} ({total_fraud/len(claims)*100:.1f}%)')
print(f'Unique claim IDs written: {len(set(c["claim_id"] for c in claims))}')
