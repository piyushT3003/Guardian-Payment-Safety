"""
Guardian - Evaluation
======================
Compares the detector's flags against ground-truth labels and reports the
metrics that actually matter for the pitch:

  - Transaction-level precision / recall / false-positive rate
  - Sequence-level catch rate: did we flag AT LEAST ONE transaction in
    every real scam sequence? (this is what matters in practice - the
    family gets alerted if any part of the sequence is caught)
  - Time-to-first-flag: how many transactions into a scam sequence did
    we catch it?
"""

import pandas as pd
from detector import load_data, run_detector


def evaluate(results_df):
    tp = ((results_df["flagged_suspicious"]) & (results_df["actual_is_scam"])).sum()
    fp = ((results_df["flagged_suspicious"]) & (~results_df["actual_is_scam"])).sum()
    fn = ((~results_df["flagged_suspicious"]) & (results_df["actual_is_scam"])).sum()
    tn = ((~results_df["flagged_suspicious"]) & (~results_df["actual_is_scam"])).sum()

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0

    print("=" * 60)
    print("TRANSACTION-LEVEL METRICS")
    print("=" * 60)
    print(f"True Positives  (correctly flagged scam txns):     {tp}")
    print(f"False Positives (normal txns wrongly flagged):      {fp}")
    print(f"False Negatives (scam txns missed):                 {fn}")
    print(f"True Negatives  (normal txns correctly ignored):    {tn}")
    print()
    print(f"Precision:            {precision:.1%}  (of what we flagged, % that were real scams)")
    print(f"Recall:               {recall:.1%}  (of real scam txns, % we caught)")
    print(f"False Positive Rate:  {false_positive_rate:.2%}  (of normal txns, % wrongly flagged)")
    print()

    # Sequence-level: did we catch at least one transaction per real scam sequence?
    scam_txns = results_df[results_df["actual_is_scam"]]
    scam_users = scam_txns["user_id"].unique()

    sequences_caught = 0
    time_to_flag = []
    for user_id in scam_users:
        user_scam_txns = scam_txns[scam_txns["user_id"] == user_id].sort_values("date").reset_index(drop=True)
        flagged_positions = user_scam_txns.index[user_scam_txns["flagged_suspicious"]].tolist()
        if flagged_positions:
            sequences_caught += 1
            time_to_flag.append(flagged_positions[0] + 1)  # 1-indexed: "caught on the Nth txn of the sequence"

    print("=" * 60)
    print("SEQUENCE-LEVEL METRICS (what matters for the family alert)")
    print("=" * 60)
    print(f"Real scam sequences in dataset:        {len(scam_users)}")
    print(f"Sequences with at least one flag:      {sequences_caught}")
    print(f"Sequence catch rate:                   {sequences_caught / len(scam_users):.1%}")
    if time_to_flag:
        avg_position = sum(time_to_flag) / len(time_to_flag)
        print(f"Average position in sequence when first caught: transaction #{avg_position:.1f}")
        caught_before_drain = sum(1 for p, u in zip(time_to_flag, scam_users)
                                   if p < len(scam_txns[scam_txns['user_id'] == u]))
        print(f"Sequences caught BEFORE the final drain transaction: {caught_before_drain}/{len(scam_users)}")
    print("=" * 60)

    return {
        "precision": precision,
        "recall": recall,
        "false_positive_rate": false_positive_rate,
        "sequence_catch_rate": sequences_caught / len(scam_users) if len(scam_users) else 0,
    }


if __name__ == "__main__":
    users_df, transactions_df = load_data()
    results_df, audit_trail = run_detector(users_df, transactions_df)
    metrics = evaluate(results_df)
