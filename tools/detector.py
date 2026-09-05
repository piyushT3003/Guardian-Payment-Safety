"""
Guardian - Detection Engine
============================
Reads a user's trusted-payee list and their transaction history, and flags
transactions matching the "digital-arrest" scam pattern:

  Rule 1 (NEW PAYEE):    payee is not on the user's original trusted list
  Rule 2 (BURST):        2+ other transactions to this same payee in the
                          last N minutes
  Rule 3 (AMOUNT JUMP):  amount is far larger than the user's typical
                          transaction size

A transaction is flagged SUSPICIOUS if it's a new payee AND
(shows burst behavior OR an amount jump). Each flag comes with a
plain-language explanation and is logged to an audit trail.
"""

import pandas as pd
import json
from datetime import datetime

# ----------------------------- CONFIG -----------------------------
BURST_WINDOW_MINUTES = 60      # how far back to look for "recent" transactions to the same payee
AMOUNT_JUMP_MULTIPLIER = 5     # flag if amount > 5x the user's average transaction size
# --------------------------------------------------------------------


def load_data(users_path="guardian_users.csv", transactions_path="guardian_transactions.csv"):
    users = pd.read_csv(users_path)
    users["trusted_payees"] = users["trusted_payees"].apply(lambda s: set(s.split("|")))
    transactions = pd.read_csv(transactions_path)
    transactions["date"] = pd.to_datetime(transactions["date"])
    transactions = transactions.sort_values(["user_id", "date"]).reset_index(drop=True)
    return users, transactions


def is_new_payee(payee, trusted_payees):
    """Rule 1: payee is not on the user's original trusted list."""
    return payee not in trusted_payees


def count_recent_same_payee(transactions_df, user_id, payee, current_date, window_minutes=BURST_WINDOW_MINUTES):
    """Rule 2: how many other transactions to this same payee happened in the last N minutes."""
    window_start = current_date - pd.Timedelta(minutes=window_minutes)
    recent = transactions_df[
        (transactions_df["user_id"] == user_id) &
        (transactions_df["payee"] == payee) &
        (transactions_df["date"] >= window_start) &
        (transactions_df["date"] < current_date)
    ]
    return len(recent)


def is_amount_jump(amount, avg_transaction_amount, multiplier=AMOUNT_JUMP_MULTIPLIER):
    """Rule 3: amount is far larger than this user's typical transaction size."""
    return amount > avg_transaction_amount * multiplier


def build_explanation(row, new_payee, burst_count, amount_jump, avg_amount):
    """Generate a plain-language explanation a non-technical family member can read."""
    reasons = []
    if new_payee:
        reasons.append("this payee has never been paid before")
    if burst_count > 0:
        reasons.append(
            f"{burst_count} other transfer(s) to the same payee happened in the last "
            f"{BURST_WINDOW_MINUTES} minutes"
        )
    if amount_jump:
        multiple = round(row["amount"] / avg_amount, 1)
        reasons.append(
            f"the amount (\u20b9{row['amount']}) is {multiple}x this person's usual transaction size (\u20b9{avg_amount})"
        )
    if not reasons:
        return None
    return (
        f"Flagged: \u20b9{row['amount']} sent to '{row['payee']}' on {row['date']}. "
        f"Reason(s): {'; '.join(reasons)}."
    )


def run_detector(users_df, transactions_df):
    """
    Runs the full rule set over every transaction.
    Returns the transactions dataframe with detection columns added,
    plus an audit trail (list of dicts) for every transaction that was evaluated.
    """
    users_lookup = users_df.set_index("user_id").to_dict("index")

    results = []
    audit_trail = []

    for idx, row in transactions_df.iterrows():
        user_id = row["user_id"]
        user_info = users_lookup[user_id]

        new_payee = is_new_payee(row["payee"], user_info["trusted_payees"])
        burst_count = count_recent_same_payee(transactions_df, user_id, row["payee"], row["date"])
        amount_jump = is_amount_jump(row["amount"], user_info["avg_transaction_amount"])

        # Core decision rule: new payee AND (burst OR amount jump)
        flagged = new_payee and (burst_count > 0 or amount_jump)

        explanation = build_explanation(row, new_payee, burst_count, amount_jump, user_info["avg_transaction_amount"]) if flagged else None

        results.append({
            "transaction_id": row["transaction_id"],
            "user_id": user_id,
            "date": row["date"],
            "payee": row["payee"],
            "amount": row["amount"],
            "new_payee": new_payee,
            "burst_count": burst_count,
            "amount_jump": amount_jump,
            "flagged_suspicious": flagged,
            "explanation": explanation,
            "actual_is_scam": row["is_scam"],  # ground truth, for evaluation only
        })

        audit_trail.append({
            "transaction_id": row["transaction_id"],
            "user_id": int(user_id),
            "timestamp": str(row["date"]),
            "rules_checked": {
                "new_payee": bool(new_payee),
                "burst_count_last_60min": int(burst_count),
                "amount_jump": bool(amount_jump),
            },
            "decision": "FLAGGED" if flagged else "OK",
            "explanation": explanation,
        })

    results_df = pd.DataFrame(results)
    return results_df, audit_trail


if __name__ == "__main__":
    users_df, transactions_df = load_data()
    results_df, audit_trail = run_detector(users_df, transactions_df)

    results_df.to_csv("guardian_detection_results.csv", index=False)
    with open("guardian_audit_trail.json", "w") as f:
        json.dump(audit_trail, f, indent=2, default=str)

    num_flagged = results_df["flagged_suspicious"].sum()
    print(f"Evaluated {len(results_df)} transactions.")
    print(f"Flagged {num_flagged} as suspicious.")
    print()
    print("Sample flagged transactions with explanations:")
    for _, r in results_df[results_df["flagged_suspicious"]].head(5).iterrows():
        print(f"  - {r['explanation']}")
