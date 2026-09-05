"""
Guardian - Family Alert Generator
===================================
Takes flagged transactions and groups them into scam SEQUENCES (not
individual alerts per transaction, which would spam the family). Produces
one clear, plain-language alert per sequence - written the way a person
would explain it, not a technical log line.
"""

import pandas as pd
from detector import load_data, run_detector


def group_into_sequences(results_df, gap_minutes=90):
    """
    Groups a flagged user's suspicious transactions into sequences, based on
    same payee + close together in time. This avoids sending 4 separate
    alerts for what is really one scam event.
    """
    flagged = results_df[results_df["flagged_suspicious"]].sort_values(["user_id", "payee", "date"])
    sequences = []

    for (user_id, payee), group in flagged.groupby(["user_id", "payee"]):
        group = group.sort_values("date").reset_index(drop=True)
        current_seq = [group.iloc[0]]

        for i in range(1, len(group)):
            gap = (group.iloc[i]["date"] - current_seq[-1]["date"]).total_seconds() / 60
            if gap <= gap_minutes:
                current_seq.append(group.iloc[i])
            else:
                sequences.append(pd.DataFrame(current_seq))
                current_seq = [group.iloc[i]]
        sequences.append(pd.DataFrame(current_seq))

    return sequences


def build_family_alert(sequence_df, user_name):
    """Turns one flagged sequence into a single, plain-language family alert."""
    total_amount = sequence_df["amount"].sum()
    num_txns = len(sequence_df)
    payee = sequence_df.iloc[0]["payee"]
    start_time = sequence_df.iloc[0]["date"]
    end_time = sequence_df.iloc[-1]["date"]
    duration_minutes = (end_time - start_time).total_seconds() / 60
    largest = sequence_df["amount"].max()

    txn_list = "\n".join(
        f"   \u2022 \u20b9{row['amount']} at {row['date'].strftime('%I:%M %p')}"
        for _, row in sequence_df.iterrows()
    )

    message = f"""\U0001F6A8 GUARDIAN ALERT for {user_name}

We noticed {num_txns} transfers to a payee {user_name} has never paid before,
totaling \u20b9{total_amount:,}, all within {duration_minutes:.0f} minutes:

{txn_list}

This pattern (several small transfers followed by a larger one, to a brand
new payee, in a short window) matches known "digital arrest" / screen-share
scam tactics currently active in India.

What to do now:
   1. Call {user_name} directly right now - do not send a message, call.
   2. Ask if they are currently on a phone or video call with anyone
      claiming to be police, CBI, ED, customs, or a bank official.
   3. If yes, tell them to hang up immediately. No real government agency
      conducts arrests or investigations over a video call.
   4. If money has already been sent, contact the bank to attempt a
      transaction freeze, and file a complaint at cybercrime.gov.in or
      call 1930 (India's cyber fraud helpline).
"""
    return message


if __name__ == "__main__":
    users_df, transactions_df = load_data()
    results_df, audit_trail = run_detector(users_df, transactions_df)

    sequences = group_into_sequences(results_df)
    users_lookup = users_df.set_index("user_id")["name"].to_dict()

    print(f"Generated {len(sequences)} family alert(s) from {len(results_df)} transactions.\n")

    for i, seq in enumerate(sequences, 1):
        user_id = seq.iloc[0]["user_id"]
        user_name = users_lookup[user_id]
        alert = build_family_alert(seq, user_name)
        print(f"--- ALERT {i} ---")
        print(alert)
        print()
