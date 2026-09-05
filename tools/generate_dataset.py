"""
Guardian - Synthetic UPI Transaction Dataset Generator
========================================================
Generates realistic elderly-user UPI transaction history, with a controlled
percentage of users having an injected "digital-arrest" scam sequence:

  Scam pattern = 2-3 small test transfers to a NEW payee,
                 followed by one large drain transfer to the SAME payee,
                 all within a tight time window.

Each user profile includes a "trusted_payees" list (the regulars they
already pay: groceries, utilities, family). This models a real setup where
a family member/bank whitelists known payees when the account is set up -
so "new payee" means "not on this original trusted list", not just
"not seen yet in this 90-day window". This avoids flagging a person's
very first payment to their own daughter as suspicious just because it's
early in our sample window.

Outputs (in this folder):
  - guardian_users.csv         : user profiles + their trusted payee list
  - guardian_transactions.csv  : all transactions, with ground-truth
                                  is_scam label for evaluation
"""

import pandas as pd
import numpy as np
import random
import uuid
from datetime import datetime, timedelta

# ----------------------------- CONFIG -----------------------------
NUM_USERS = 50
DAYS_OF_HISTORY = 90
SCAM_RATE = 0.20          # fraction of users who get a scam sequence injected
RANDOM_SEED = 42
# --------------------------------------------------------------------



COMMON_PAYEE_CATEGORIES = [
    "Grocery Store", "Electricity Board", "Son", "Daughter", "Gas Agency",
    "Local Pharmacy", "Milk Vendor", "Cable TV", "Grandchild", "Temple Donation",
    "Water Bill", "Newspaper Vendor"
]


def generate_user_profile(user_id):
    return {
        "user_id": user_id,
        "name": f"User_{user_id}",
        "age": random.randint(60, 85),
        "avg_transaction_amount": random.choice([200, 300, 500, 800, 1000]),
        "trusted_payees": random.sample(COMMON_PAYEE_CATEGORIES, k=random.randint(4, 6)),
        "active_hours": (8, 21),
    }


def generate_normal_transactions(user, start_date, days):
    transactions = []
    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        if random.random() < 0.3:
            hour = random.randint(*user["active_hours"])
            minute = random.randint(0, 59)
            timestamp = current_date.replace(hour=hour, minute=minute)
            payee = random.choice(user["trusted_payees"])
            amount = max(50, round(np.random.normal(
                user["avg_transaction_amount"],
                user["avg_transaction_amount"] * 0.3
            )))
            transactions.append({
                "transaction_id": str(uuid.uuid4())[:8],
                "user_id": user["user_id"],
                "date": timestamp,
                "payee": payee,
                "amount": amount,
                "is_scam": False,
            })
    return transactions


def inject_scam_sequence(user, existing_transactions, days):
    all_dates = sorted(set(t["date"].date() for t in existing_transactions))
    if all_dates:
        pick_from = all_dates[len(all_dates) // 2:] if len(all_dates) > 1 else all_dates
        base_date = datetime.combine(random.choice(pick_from), datetime.min.time())
    else:
        base_date = datetime.now() - timedelta(days=30)

    scam_payee = f"NewPayee_{user['user_id']}_{uuid.uuid4().hex[:5]}"
    current_time = base_date.replace(hour=random.randint(10, 18), minute=random.randint(0, 59))

    scam_txns = []
    for _ in range(random.randint(2, 3)):
        current_time += timedelta(minutes=random.randint(3, 15))
        test_amount = random.choice([100, 200, 500, 1000])
        scam_txns.append({
            "transaction_id": str(uuid.uuid4())[:8],
            "user_id": user["user_id"],
            "date": current_time,
            "payee": scam_payee,
            "amount": test_amount,
            "is_scam": True,
        })

    current_time += timedelta(minutes=random.randint(5, 20))
    drain_amount = user["avg_transaction_amount"] * random.randint(15, 40)
    scam_txns.append({
        "transaction_id": str(uuid.uuid4())[:8],
        "user_id": user["user_id"],
        "date": current_time,
        "payee": scam_payee,
        "amount": drain_amount,
        "is_scam": True,
    })
    return scam_txns


def main():
    users = [generate_user_profile(i) for i in range(1, NUM_USERS + 1)]
    start_date = datetime.now() - timedelta(days=DAYS_OF_HISTORY)
    scam_user_ids = set(random.sample([u["user_id"] for u in users], k=int(NUM_USERS * SCAM_RATE)))

    all_transactions = []
    for user in users:
        normal_txns = generate_normal_transactions(user, start_date, DAYS_OF_HISTORY)
        all_transactions.extend(normal_txns)
        if user["user_id"] in scam_user_ids:
            all_transactions.extend(inject_scam_sequence(user, normal_txns, DAYS_OF_HISTORY))

    transactions_df = pd.DataFrame(all_transactions).sort_values(
        ["user_id", "date"]
    ).reset_index(drop=True)

    users_df = pd.DataFrame([{
        "user_id": u["user_id"],
        "name": u["name"],
        "age": u["age"],
        "avg_transaction_amount": u["avg_transaction_amount"],
        "trusted_payees": "|".join(u["trusted_payees"]),  # pipe-separated for easy CSV storage
        "has_scam_sequence": u["user_id"] in scam_user_ids,
    } for u in users])

    return users_df, transactions_df, scam_user_ids


if __name__ == "__main__":
    users_df, transactions_df, scam_user_ids = main()

    users_df.to_csv("guardian_users.csv", index=False)
    transactions_df.to_csv("guardian_transactions.csv", index=False)

    print(f"Generated {len(users_df)} users, {len(transactions_df)} transactions.")
    print(f"Scam sequences injected for {len(scam_user_ids)} users: {sorted(scam_user_ids)}")
    print(f"Total scam-labeled transactions: {transactions_df['is_scam'].sum()}")
