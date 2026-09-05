"""
Guardian - Robustness / Generalization Test
=============================================
The honest criticism of the original evaluation: generate_dataset.py injects
scam sequences using ONE specific template (2-3 small test transfers, 3-15
min apart, same payee, then a 15-40x drain) - and detector.py's rules were
written by looking at exactly that template. Scoring 100%/73% on that data
proves the rules fire as designed, not that they'd generalize.

This script generates SIX additional scam pattern variants that deliberately
diverge from the original template along different dimensions, runs the
UNMODIFIED detector.py against them, and reports honest per-variant results
- including where it fails. This is real generalization evidence, not a
restatement of the same numbers.

Variants (none of these shapes were used when the three rules were written):
  1. single_test        - only ONE small test transfer before the drain
                           (original template always used 2-3)
  2. slow_drip           - test transfers 25-45 min apart, drain 70+ min
                           after the last test (original: 3-15 min gaps,
                           all within the 60-min burst window)
  3. split_payee         - test transfers to payee A, drain to a DIFFERENT
                           new payee B (defeats the "same payee" burst rule
                           entirely - this is a genuine stress case)
  4. modest_drain        - drain is only 4-8x avg transaction size, near
                           the AMOUNT_JUMP_MULTIPLIER=5 boundary, instead of
                           15-40x
  5. no_test_direct_drain- scammer skips the test transfers, goes straight
                           to one large transfer to a brand-new payee
  6. noisy_week          - same as the original template, but the user also
                           makes several OTHER legitimate new-payee payments
                           that week (stress test for false positives, not
                           just recall)

Run: python3 robustness_test.py
"""

import pandas as pd
import numpy as np
import random
import uuid
from datetime import datetime, timedelta

from generate_dataset import generate_user_profile, generate_normal_transactions, COMMON_PAYEE_CATEGORIES
from detector import run_detector

RANDOM_SEED = 7  # deliberately different from generate_dataset.py's seed (42)
NUM_USERS_PER_VARIANT = 15
DAYS_OF_HISTORY = 90


def pick_base_date(existing_transactions):
    all_dates = sorted(set(t["date"].date() for t in existing_transactions))
    if all_dates:
        pick_from = all_dates[len(all_dates) // 2:] if len(all_dates) > 1 else all_dates
        return datetime.combine(random.choice(pick_from), datetime.min.time())
    return datetime.now() - timedelta(days=30)


def variant_single_test(user, existing_txns):
    base = pick_base_date(existing_txns)
    payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))
    txns = [{"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
             "payee": payee, "amount": random.choice([100, 200, 500]), "is_scam": True}]
    t += timedelta(minutes=random.randint(5, 15))
    drain = user["avg_transaction_amount"] * random.randint(15, 30)
    txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                 "payee": payee, "amount": drain, "is_scam": True})
    return txns


def variant_slow_drip(user, existing_txns):
    base = pick_base_date(existing_txns)
    payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(9, 15), minute=random.randint(0, 59))
    txns = []
    for _ in range(random.randint(2, 3)):
        t += timedelta(minutes=random.randint(25, 45))
        txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                     "payee": payee, "amount": random.choice([100, 200, 500]), "is_scam": True})
    t += timedelta(minutes=random.randint(70, 110))  # gap exceeds the 60-min burst window
    drain = user["avg_transaction_amount"] * random.randint(15, 30)
    txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                 "payee": payee, "amount": drain, "is_scam": True})
    return txns


def variant_split_payee(user, existing_txns):
    base = pick_base_date(existing_txns)
    payee_a = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    payee_b = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))
    txns = []
    for _ in range(random.randint(2, 3)):
        t += timedelta(minutes=random.randint(3, 15))
        txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                     "payee": payee_a, "amount": random.choice([100, 200, 500]), "is_scam": True})
    t += timedelta(minutes=random.randint(5, 20))
    drain = user["avg_transaction_amount"] * random.randint(15, 30)
    txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                 "payee": payee_b, "amount": drain, "is_scam": True})
    return txns


def variant_modest_drain(user, existing_txns):
    base = pick_base_date(existing_txns)
    payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))
    txns = []
    for _ in range(random.randint(2, 3)):
        t += timedelta(minutes=random.randint(3, 15))
        txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                     "payee": payee, "amount": random.choice([100, 200, 500]), "is_scam": True})
    t += timedelta(minutes=random.randint(5, 20))
    drain = round(user["avg_transaction_amount"] * random.uniform(4, 8))  # near the 5x threshold
    txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                 "payee": payee, "amount": drain, "is_scam": True})
    return txns


def variant_no_test_direct_drain(user, existing_txns):
    base = pick_base_date(existing_txns)
    payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))
    drain = user["avg_transaction_amount"] * random.randint(15, 30)
    return [{"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
             "payee": payee, "amount": drain, "is_scam": True}]


def variant_noisy_week(user, existing_txns):
    # same template as the original, PLUS 2-3 unrelated legit new-payee payments
    # that same week, to see if those get wrongly swept up (FPR stress, not recall)
    scam_txns = []
    base = pick_base_date(existing_txns)
    payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    t = base.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))
    for _ in range(random.randint(2, 3)):
        t += timedelta(minutes=random.randint(3, 15))
        scam_txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                          "payee": payee, "amount": random.choice([100, 200, 500]), "is_scam": True})
    t += timedelta(minutes=random.randint(5, 20))
    drain = user["avg_transaction_amount"] * random.randint(15, 30)
    scam_txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": t,
                      "payee": payee, "amount": drain, "is_scam": True})

    noise_txns = []
    for _ in range(random.randint(2, 3)):
        noise_day = base + timedelta(days=random.randint(-3, 3))
        noise_t = noise_day.replace(hour=random.randint(9, 20), minute=random.randint(0, 59))
        legit_new_payee = f"OneOffPayee_{user['user_id']}_{uuid.uuid4().hex[:4]}"
        noise_txns.append({"transaction_id": str(uuid.uuid4())[:8], "user_id": user["user_id"], "date": noise_t,
                           "payee": legit_new_payee,
                           "amount": max(50, round(np.random.normal(user["avg_transaction_amount"],
                                                                     user["avg_transaction_amount"] * 0.3))),
                           "is_scam": False})
    return scam_txns + noise_txns


VARIANTS = {
    "single_test": variant_single_test,
    "slow_drip": variant_slow_drip,
    "split_payee": variant_split_payee,
    "modest_drain": variant_modest_drain,
    "no_test_direct_drain": variant_no_test_direct_drain,
    "noisy_week": variant_noisy_week,
}


def build_variant_dataset(variant_fn, num_users, start_user_id):
    users, transactions = [], []
    for i in range(num_users):
        user = generate_user_profile(start_user_id + i)
        users.append(user)
        start_date = datetime.now() - timedelta(days=DAYS_OF_HISTORY)
        normal = generate_normal_transactions(user, start_date, DAYS_OF_HISTORY)
        transactions.extend(normal)
        transactions.extend(variant_fn(user, normal))

    users_df = pd.DataFrame([{
        "user_id": u["user_id"], "name": u["name"], "age": u["age"],
        "avg_transaction_amount": u["avg_transaction_amount"],
        "trusted_payees": "|".join(u["trusted_payees"]),
        "has_scam_sequence": True,
    } for u in users])
    transactions_df = pd.DataFrame(transactions).sort_values(["user_id", "date"]).reset_index(drop=True)
    return users_df, transactions_df


def evaluate_variant(users_df, transactions_df):
    users_df = users_df.copy()
    users_df["trusted_payees"] = users_df["trusted_payees"].apply(lambda s: set(s.split("|")))
    transactions_df = transactions_df.copy()
    transactions_df["date"] = pd.to_datetime(transactions_df["date"])
    transactions_df = transactions_df.sort_values(["user_id", "date"]).reset_index(drop=True)

    results_df, _ = run_detector(users_df, transactions_df)

    scam_txns = results_df[results_df["actual_is_scam"]]
    normal_txns = results_df[~results_df["actual_is_scam"]]

    tp = (scam_txns["flagged_suspicious"]).sum()
    fn = (~scam_txns["flagged_suspicious"]).sum()
    fp = (normal_txns["flagged_suspicious"]).sum()

    scam_users = scam_txns["user_id"].unique()
    sequences_caught = sum(
        1 for uid in scam_users
        if results_df[(results_df["user_id"] == uid) & (results_df["actual_is_scam"])]["flagged_suspicious"].any()
    )
    caught_before_drain = 0
    for uid in scam_users:
        user_scam = results_df[(results_df["user_id"] == uid) & (results_df["actual_is_scam"])].sort_values("date")
        flagged_positions = user_scam.reset_index(drop=True)
        idxs = flagged_positions.index[flagged_positions["flagged_suspicious"]].tolist()
        if idxs and idxs[0] < len(flagged_positions) - 1:
            caught_before_drain += 1
        elif idxs and len(flagged_positions) == 1:
            pass  # single-transaction sequence: "before drain" doesn't apply

    return {
        "scam_txns": len(scam_txns),
        "recall": tp / (tp + fn) if (tp + fn) else 0,
        "sequences_total": len(scam_users),
        "sequences_caught": sequences_caught,
        "sequence_catch_rate": sequences_caught / len(scam_users) if len(scam_users) else 0,
        "caught_before_final_drain": caught_before_drain,
        "false_positives_on_noise": int(fp),
        "normal_txns": len(normal_txns),
    }


def main():
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    print("=" * 78)
    print("ROBUSTNESS TEST — scam pattern shapes NOT used when the rules were written")
    print("=" * 78)
    print(f"{'Variant':<24}{'Recall':>10}{'Seq caught':>14}{'Before drain':>16}{'FPs on noise':>15}")
    print("-" * 78)

    overall_rows = []
    uid_cursor = 1000  # keep user_ids well clear of the original dataset
    for name, fn in VARIANTS.items():
        users_df, transactions_df = build_variant_dataset(fn, NUM_USERS_PER_VARIANT, uid_cursor)
        uid_cursor += NUM_USERS_PER_VARIANT
        metrics = evaluate_variant(users_df, transactions_df)
        overall_rows.append((name, metrics))
        print(f"{name:<24}{metrics['recall']:>9.0%} "
              f"{metrics['sequences_caught']:>7}/{metrics['sequences_total']:<6}"
              f"{metrics['caught_before_final_drain']:>10}/{metrics['sequences_total']:<6}"
              f"{metrics['false_positives_on_noise']:>10}/{metrics['normal_txns']}")

    print("-" * 78)
    total_seq = sum(m["sequences_total"] for _, m in overall_rows)
    total_caught = sum(m["sequences_caught"] for _, m in overall_rows)
    print(f"\nOverall across all 6 unseen pattern shapes: "
          f"{total_caught}/{total_seq} sequences caught ({total_caught/total_seq:.0%})")
    print("\nWorth calling out by name in the pitch (don't hide these):")
    for name, m in overall_rows:
        if m["sequence_catch_rate"] < 0.99:
            print(f"  - '{name}': only {m['sequence_catch_rate']:.0%} caught — "
                  f"{'defeats the same-payee burst rule entirely' if name == 'split_payee' else 'a real gap'}")
    print("=" * 78)


if __name__ == "__main__":
    main()
