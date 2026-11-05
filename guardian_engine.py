from __future__ import annotations

import math
from dataclasses import dataclass, asdict
from datetime import timedelta
from typing import Optional

import pandas as pd
try:
    from sklearn.ensemble import IsolationForest
except Exception:
    IsolationForest = None

BURST_WINDOW_MINUTES = 60
MIN_HISTORY_FOR_MODEL = 10


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(r * c, 1)


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
    distance_km: Optional[float] = None
    velocity_kmh: Optional[float] = None
    geofence_status: Optional[str] = None

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
            "distance_km": self.distance_km,
            "velocity_kmh": self.velocity_kmh,
            "geofence_status": self.geofence_status,
            "impossible_speed": bool(self.velocity_kmh and self.velocity_kmh > 850),
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
        class LazyModelDict(dict):
            def __init__(self, txns):
                super().__init__()
                self._txns = txns

            def __missing__(self, key):
                user_txns = self._txns[self._txns["user_id"].astype(str) == str(key)]
                amounts = user_txns[["amount"]].astype(float).values if not user_txns.empty else []
                if len(amounts) >= MIN_HISTORY_FOR_MODEL and IsolationForest is not None:
                    model = IsolationForest(n_estimators=64, contamination="auto", random_state=42)
                    model.fit(amounts)
                    self[key] = model
                else:
                    self[key] = None
                return self[key]

        return LazyModelDict(self.txns)

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
        origin_lat: float | None = None,
        origin_lon: float | None = None,
        origin_city: str | None = None,
        dest_lat: float | None = None,
        dest_lon: float | None = None,
        dest_city: str | None = None,
        accuracy_meters: float | None = None,
        elderly_age: int | None = None,
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
                history = pd.concat([history, extra], ignore_index=True).sort_values("date")

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
            if IsolationForest is not None:
                model = IsolationForest(n_estimators=64, contamination="auto", random_state=42)
                model.fit(history[["amount"]].astype(float).values)
                ai_score = float(model.decision_function([[amount]])[0])
                ai_anomaly = int(model.predict([[amount]])[0]) == -1
            else:
                std = float(history["amount"].std()) if len(history) > 1 else 0.0
                if std > 0:
                    z = (amount - avg) / std
                    ai_score = round(float(z), 3)
                    ai_anomaly = bool(z > 2.5)
                else:
                    ai_anomaly = bool(amount_ratio > 3.0)
                    ai_score = round(float(amount_ratio), 3)

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

        # Geospatial distance & Geofence analysis
        distance_km: float | None = None
        geofence_status: str | None = None
        if origin_lat is not None and origin_lon is not None and dest_lat is not None and dest_lon is not None:
            distance_km = haversine_km(float(origin_lat), float(origin_lon), float(dest_lat), float(dest_lon))
            if distance_km >= 3000:
                geofence_status = "CROSS_BORDER_ANOMALY"
                score += 30
                dest_name = dest_city or "Overseas Node"
                reasons.append(f"Offshore Geofence Anomaly: Recipient node is {int(distance_km):,} km away ({dest_name}), outside user's domestic corridor")
            elif distance_km >= 500:
                geofence_status = "INTER_CITY_OUT_OF_PATTERN"
                if new_payee:
                    score += 15
                    reasons.append(f"Inter-city transfer to unfamiliar corridor: {int(distance_km):,} km to {dest_city or 'remote city'}")
            else:
                geofence_status = "LOCAL_CORRIDOR"

        # Impossible Velocity & Teleportation analysis
        velocity_kmh: float | None = None
        if origin_lat is not None and origin_lon is not None and len(history) > 0:
            if "origin_lat" in history.columns and "origin_lon" in history.columns:
                prior_geo = history.dropna(subset=["origin_lat", "origin_lon"]).sort_values("date")
                if not prior_geo.empty:
                    last_tx = prior_geo.iloc[-1]
                    last_lat = float(last_tx["origin_lat"])
                    last_lon = float(last_tx["origin_lon"])
                    last_date = pd.Timestamp(last_tx["date"]).to_pydatetime()
                    dist_delta = haversine_km(last_lat, last_lon, float(origin_lat), float(origin_lon))
                    time_delta_hours = max(0.005, (created_at - last_date).total_seconds() / 3600.0)
                    velocity_kmh = round(dist_delta / time_delta_hours, 1)
                    if velocity_kmh > 850 and dist_delta > 80:
                        score += 35
                        time_mins = max(1, int(time_delta_hours * 60))
                        reasons.append(f"Impossible Velocity Anomaly: {int(velocity_kmh):,} km/h speed across {int(dist_delta)} km in {time_mins} mins (exceeds 850 km/h flight physics)")

        # Senior vulnerability weighting
        if elderly_age is not None and int(elderly_age) >= 65:
            if amount >= 15000 and (new_payee or unusual_amount):
                score += 15
                reasons.append(f"Senior Vulnerability Pattern: Age {elderly_age} account subjected to sudden large transfer (₹{amount:,.0f})")

        # GPS accuracy warning
        if accuracy_meters is not None and float(accuracy_meters) > 5000:
            reasons.append(f"Degraded GPS Accuracy: Device location precision is low (±{int(accuracy_meters)}m)")

        if new_payee and (burst_count > 0 or unusual_amount or ai_anomaly or geofence_status == "CROSS_BORDER_ANOMALY" or (velocity_kmh and velocity_kmh > 850)):
            score = max(score, 70)
        # A rapid sequence plus an unusual amount, or cross-border/teleportation anomaly, is treated as high-risk
        if (burst_count > 0 and (unusual_amount or ai_anomaly)) or geofence_status == "CROSS_BORDER_ANOMALY" or (velocity_kmh and velocity_kmh > 850):
            score = max(score, 85)
        elif not new_payee and not (burst_count > 0 and (unusual_amount or ai_anomaly)) and geofence_status != "CROSS_BORDER_ANOMALY":
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
            distance_km=distance_km,
            velocity_kmh=velocity_kmh,
            geofence_status=geofence_status,
        )

    def analyze(
        self,
        user_id,
        payee,
        amount,
        created_at,
        transaction_id="live",
        origin_lat: float | None = None,
        origin_lon: float | None = None,
        origin_city: str | None = None,
        dest_lat: float | None = None,
        dest_lon: float | None = None,
        dest_city: str | None = None,
        accuracy_meters: float | None = None,
        elderly_age: int | None = None,
    ) -> RiskResult:
        """Deployment-friendly alias used by the Flask app."""
        return self.score(
            user_id=user_id,
            payee=payee,
            amount=amount,
            created_at=created_at,
            transaction_id=transaction_id,
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            origin_city=origin_city,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            dest_city=dest_city,
            accuracy_meters=accuracy_meters,
            elderly_age=elderly_age,
        )
