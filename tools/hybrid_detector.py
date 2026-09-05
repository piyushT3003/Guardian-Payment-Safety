"""
Guardian - Hybrid Detector (rules + learned anomaly signal)
==============================================================
The original detector.py's "amount jump" rule was a single hardcoded
constant: amount > 5x the user's average. That's a real weakness for an
"AI buildathon" submission - it's not learned or adaptive to any individual
user's actual spending shape (a user whose spending varies a lot vs one
who's always within ₹20 of the same amount should not share one flat
multiplier).

This module replaces that one rule with an unsupervised anomaly score
(IsolationForest) trained PER USER on their own transaction history - with
NO scam labels used in training, exactly as it would work in a real
deployment where you don't know in advance which transactions are scams.
Rules 1 (new payee) and 2 (burst timing) stay as they are: they encode a
real structural fact about the scam pattern (new relationship + rapid
repeated contact), not an arbitrary threshold, so there's no ML upside to
replacing them - forcing an ML model onto every rule just to say "more AI"
would be worse engineering, not better.

Decision rule (unchanged in spirit, upgraded in substance):
  flagged = new_payee AND (burst_count > 0 OR anomaly_score flags this
            amount as unusual for THIS user, learned from their own
            history)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

from detector import load_data, is_new_payee, count_recent_same_payee, BURST_WINDOW_MINUTES

MIN_HISTORY_FOR_MODEL = 5  # below this, fall back to the simple multiplier - not enough data to fit a model


def fit_user_anomaly_models(transactions_df):
    """
    Fits one IsolationForest per user on their own amount history (unsupervised,
    no is_scam label used). Returns {user_id: fitted_model or None}.
    """
    models = {}
    for user_id, group in transactions_df.groupby("user_id"):
        amounts = group[["amount"]].values
        if len(amounts) < MIN_HISTORY_FOR_MODEL:
            models[user_id] = None
            continue
        # contamination='auto' with a low expected outlier fraction: most real spending is routine
        model = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
        model.fit(amounts)
        models[user_id] = model
    return models


def is_amount_anomalous(amount, user_id, models, avg_amount, fallback_multiplier=5):
    """
    Returns (is_anomalous: bool, method: str, detail: str).
    Uses the learned per-user model where there's enough history; otherwise
    falls back to the original flat multiplier rule (honestly labeled as such).
    """
    model = models.get(user_id)
    if model is None:
        anomalous = amount > avg_amount * fallback_multiplier
        return anomalous, "fallback_rule", f"{amount / avg_amount:.1f}x this user's average (insufficient history for a learned model)"
    score = model.decision_function([[amount]])[0]   # higher = more normal, lower/negative = more anomalous
    prediction = model.predict([[amount]])[0]          # -1 = anomaly, 1 = normal
    anomalous = prediction == -1
    return anomalous, "learned_model", f"anomaly score {score:.3f} (learned from this user's own transaction history)"


def run_hybrid_detector(users_df, transactions_df):
    users_lookup = users_df.set_index("user_id").to_dict("index")
    models = fit_user_anomaly_models(transactions_df)

    results = []
    for _, row in transactions_df.iterrows():
        user_id = row["user_id"]
        user_info = users_lookup[user_id]

        new_payee = is_new_payee(row["payee"], user_info["trusted_payees"])
        burst_count = count_recent_same_payee(transactions_df, user_id, row["payee"], row["date"])
        anomalous, method, detail = is_amount_anomalous(
            row["amount"], user_id, models, user_info["avg_transaction_amount"]
        )

        flagged = new_payee and (burst_count > 0 or anomalous)

        reasons = []
        if new_payee:
            reasons.append("this payee has never been paid before")
        if burst_count > 0:
            reasons.append(f"{burst_count} other transfer(s) to the same payee happened in the last {BURST_WINDOW_MINUTES} minutes")
        if anomalous:
            reasons.append(f"the amount is unusual for this person ({detail})")
        explanation = (
            f"Flagged: \u20b9{row['amount']} sent to '{row['payee']}' on {row['date']}. Reason(s): {'; '.join(reasons)}."
            if flagged else None
        )

        results.append({
            "transaction_id": row["transaction_id"], "user_id": user_id, "date": row["date"],
            "payee": row["payee"], "amount": row["amount"], "new_payee": new_payee,
            "burst_count": burst_count, "amount_anomalous": anomalous, "anomaly_method": method,
            "flagged_suspicious": flagged, "explanation": explanation,
            "actual_is_scam": row["is_scam"],
        })

    return pd.DataFrame(results)


def compare_to_baseline():
    from detector import run_detector as run_baseline_detector

    users_df, transactions_df = load_data()
    baseline_df, _ = run_baseline_detector(users_df, transactions_df)
    hybrid_df = run_hybrid_detector(users_df, transactions_df)

    def metrics(df):
        tp = ((df["flagged_suspicious"]) & (df["actual_is_scam"])).sum()
        fp = ((df["flagged_suspicious"]) & (~df["actual_is_scam"])).sum()
        fn = ((~df["flagged_suspicious"]) & (df["actual_is_scam"])).sum()
        tn = ((~df["flagged_suspicious"]) & (~df["actual_is_scam"])).sum()
        precision = tp / (tp + fp) if (tp + fp) else 0
        recall = tp / (tp + fn) if (tp + fn) else 0
        scam_users = df[df["actual_is_scam"]]["user_id"].unique()
        caught = sum(1 for uid in scam_users if df[(df["user_id"] == uid) & (df["actual_is_scam"])]["flagged_suspicious"].any())
        return precision, recall, caught, len(scam_users), fp

    bp, br, bc, bt, bfp = metrics(baseline_df)
    hp, hr, hc, ht, hfp = metrics(hybrid_df)

    print("=" * 72)
    print("BASELINE (fixed 5x multiplier)  vs  HYBRID (learned per-user anomaly)")
    print("=" * 72)
    print(f"{'Metric':<28}{'Baseline':>18}{'Hybrid':>18}")
    print(f"{'Precision':<28}{bp:>17.0%} {hp:>17.0%}")
    print(f"{'Recall':<28}{br:>17.0%} {hr:>17.0%}")
    print(f"{'Sequences caught':<28}{f'{bc}/{bt}':>18}{f'{hc}/{ht}':>18}")
    print(f"{'False positives':<28}{bfp:>18}{hfp:>18}")
    print("=" * 72)

    return hybrid_df


if __name__ == "__main__":
    compare_to_baseline()
