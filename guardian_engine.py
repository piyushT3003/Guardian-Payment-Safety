from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import timedelta
from typing import Optional

import pandas as pd
from sklearn.ensemble import IsolationForest

BURST_WINDOW_MINUTES = 60
MIN_HISTORY_FOR_MODEL = 10


@dataclass
class RiskResult:
    transaction_id: str
    user_id: str | int
    payee: str
    amount: float
    created_at: str
    risk_score: int
    risk_level: str
    status: str
    new_payee: bool
    burst_count: int
    unusual_amount: bool
    ai_anomaly: bool
    ai_score: Optional[float]
    reasons: list[str]
    recommended_action: str

    @property
    def signals(self):
        """Structured risk signals for the dashboard/API."""
        return {
            "new_payee": bool(self.new_payee),
            "recent_payment_count": int(self.burst_count),
            "burst_detected": bool(self.burst_count > 0),
            "amount_anomaly": bool(self.unusual_amount),
            "amount_jump_ratio": None,
            "ai_anomaly": bool(self.ai_anomaly),
            "ai_score": self.ai_score,
            "amount": float(self.amount),
        }

    def to_dict(self):
        return asdict(self)


class GuardianEngine:
    """Unified, explainable transaction risk engine.

    Supports both the original two-dataframe API and the deployment app's
    one-dataframe API so the dashboard, CSV upload, demo endpoint, and older
    scripts can share the same engine.
    """

    BURST_WINDOW_MINUTES = BURST_WINDOW_MINUTES
    HIGH_RISK_THRESHOLD = 80
    MEDIUM_RISK_THRESHOLD = 60

    def __init__(self, transactions_or_users: pd.DataFrame, transactions_df: pd.DataFrame | None = None):
        if transactions_df is None:
            self.txns = transactions_or_users.copy()
            self.users = self._build_users_from_transactions(self.txns)
        else:
            self.users = transactions_or_users.copy()
            self.txns = transactions_df.copy()
        self._prepare()
        self.users_lookup = self.users.set_index("user_id").to_dict("index")
        self.models = self._fit_models()

    @staticmethod
    def _build_users_from_transactions(txns: pd.DataFrame) -> pd.DataFrame:
        if "user_id" not in txns.columns:
            raise ValueError("Transactions must contain user_id")
        rows = []
        for uid, group in txns.groupby("user_id"):
            amounts = pd.to_numeric(group.get("amount"), errors="coerce").dropna()
            rows.append({
                "user_id": uid,
                "trusted_payees": set(group.get("payee", pd.Series(dtype=str)).dropna().astype(str)),
                "avg_transaction_amount": float(amounts.mean()) if len(amounts) else 0.0,
            })
        return pd.DataFrame(rows, columns=["user_id", "trusted_payees", "avg_transaction_amount"])

    def _prepare(self):
        self.txns["date"] = pd.to_datetime(self.txns["date"], errors="coerce", utc=True)
        self.txns["amount"] = pd.to_numeric(self.txns["amount"], errors="coerce")
        self.txns = self.txns.dropna(subset=["date", "amount", "user_id"]).copy()
        self.txns = self.txns.sort_values(["user_id", "date"]).reset_index(drop=True)

        if "trusted_payees" not in self.users.columns:
            self.users["trusted_payees"] = [set() for _ in range(len(self.users))]
        else:
            def parse_trusted(value):
                if isinstance(value, set):
                    return value
                return {x.strip() for x in str(value).split("|") if x.strip()}
            self.users["trusted_payees"] = self.users["trusted_payees"].apply(parse_trusted)

        if "avg_transaction_amount" not in self.users.columns:
            self.users["avg_transaction_amount"] = 0.0

    def _fit_models(self):
        models = {}
        for uid, group in self.txns.groupby("user_id"):
            amounts = group[["amount"]].astype(float).values
            if len(amounts) < MIN_HISTORY_FOR_MODEL:
                models[uid] = None
                continue
            model = IsolationForest(
                n_estimators=64,
                contamination="auto",
                random_state=42,
            )
            model.fit(amounts)
            models[uid] = model
        return models

    def _history_before(self, user_id, created_at):
        ts = pd.Timestamp(created_at)
        return self.txns[
            (self.txns["user_id"].astype(str) == str(user_id))
            & (self.txns["date"] < ts)
        ]

    def score(
        self,
        user_id,
        payee,
        amount,
        created_at,
        transaction_id="live",
        trusted_payees_override=None,
        history_extra: pd.DataFrame | None = None,
    ) -> RiskResult:
        matches = self.users[self.users["user_id"].astype(str) == str(user_id)]
        if matches.empty:
            # In upload/demo mode, a new synthetic user is allowed; use history
            # itself as the behavioral baseline rather than rejecting the event.
            info = {
                "trusted_payees": set(),
                "avg_transaction_amount": 0.0,
            }
        else:
            info = matches.iloc[0].to_dict()

        created_at = pd.Timestamp(created_at).to_pydatetime()
        amount = float(amount)
        history = self._history_before(user_id, created_at).copy()
        if history_extra is not None and not history_extra.empty:
            extra = history_extra.copy()
            extra["date"] = pd.to_datetime(extra["date"], errors="coerce", utc=True)
            extra["amount"] = pd.to_numeric(extra["amount"], errors="coerce")
            extra = extra.dropna(subset=["date", "amount"])
            extra = extra[(extra["user_id"].astype(str) == str(user_id)) & (extra["date"] < pd.Timestamp(created_at))]
            if not extra.empty:
                history = pd.concat([history[["user_id", "payee", "amount", "date"]], extra[["user_id", "payee", "amount", "date"]]], ignore_index=True).sort_values("date")

        trusted = (
            set(trusted_payees_override)
            if trusted_payees_override is not None
            else set(info.get("trusted_payees", set()))
        )
        historical_payees = set(history["payee"].astype(str)) if len(history) else set()
        # For the one-dataframe deployment API, treat observed prior payees as
        # trusted history. This makes new-recipient detection temporal and
        # avoids marking every baseline transaction as new.
        trusted = trusted | historical_payees
        new_payee = str(payee) not in trusted

        start = created_at - timedelta(minutes=BURST_WINDOW_MINUTES)
        prior_same_payee = history[
            (history["payee"].astype(str) == str(payee))
            & (history["date"] >= pd.Timestamp(start))
        ]
        burst_count = len(prior_same_payee)

        avg = float(history["amount"].mean()) if len(history) else float(info.get("avg_transaction_amount", 0) or 0)
        amount_ratio = amount / avg if avg > 0 else 0
        unusual_amount = bool(avg > 0 and amount_ratio > 5)

        ai_anomaly = False
        ai_score = None
        if len(history) >= MIN_HISTORY_FOR_MODEL:
            model = IsolationForest(n_estimators=64, contamination="auto", random_state=42)
            model.fit(history[["amount"]].astype(float).values)
            ai_score = float(model.decision_function([[amount]])[0])
            ai_anomaly = int(model.predict([[amount]])[0]) == -1

        score = 0
        reasons = []
        if new_payee:
            score += 30
            reasons.append("New recipient: this payee is not in the user's trusted history")
        if burst_count > 0:
            score += min(30, 15 * burst_count)
            reasons.append(f"Rapid activity: {burst_count} earlier transfer(s) to this recipient within 60 minutes")
        if unusual_amount:
            score += 25
            reasons.append(f"Amount jump: ₹{amount:,.0f} is {amount_ratio:.1f}× the user's historical average")
        if ai_anomaly:
            score += 25
            if ai_score is not None:
                reasons.append(f"AI anomaly: the amount is outside the user's learned spending pattern (model score {ai_score:.3f})")
            else:
                reasons.append("AI anomaly: the amount is outside the user's learned spending pattern")

        if new_payee and (burst_count > 0 or unusual_amount or ai_anomaly):
            score = max(score, 70)
        # A rapid sequence plus an unusual amount is treated as a strong
        # sequence-level warning. Keep this deterministic so the demo reaches
        # the same high-risk presentation state as the product UI.
        if burst_count > 0 and (unusual_amount or ai_anomaly):
            score = max(score, 85)
        elif not new_payee and not (burst_count > 0 and (unusual_amount or ai_anomaly)):
            score = min(score, 59)

        score = max(0, min(100, int(score)))
        if score >= self.HIGH_RISK_THRESHOLD:
            level, action, status = "HIGH", "HOLD_FOR_REVIEW", "PENDING_REVIEW"
        elif score >= self.MEDIUM_RISK_THRESHOLD:
            level, action, status = "MEDIUM", "STEP_UP_REVIEW", "PENDING_REVIEW"
        else:
            level, action, status = "LOW", "ALLOW", "CLEAR"

        if not reasons:
            reasons.append("No strong behavioral warning signal detected")

        return RiskResult(
            transaction_id=str(transaction_id),
            user_id=user_id,
            payee=str(payee),
            amount=amount,
            created_at=created_at.isoformat(),
            risk_score=score,
            risk_level=level,
            status=status,
            new_payee=new_payee,
            burst_count=burst_count,
            unusual_amount=unusual_amount,
            ai_anomaly=ai_anomaly,
            ai_score=ai_score,
            reasons=reasons,
            recommended_action=action,
        )

    def analyze(self, user_id, payee, amount, created_at, transaction_id="live") -> RiskResult:
        """Deployment-friendly alias used by the Flask app."""
        return self.score(
            user_id=user_id,
            payee=payee,
            amount=amount,
            created_at=created_at,
            transaction_id=transaction_id,
        )
