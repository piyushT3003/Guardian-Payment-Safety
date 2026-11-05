"""
Guardian Decision & Policy Engine (v2.4-STANDARD)
=================================================
Decouples raw fraud anomaly detection from business risk governance.
Enforces versioned, deterministic policies governing:
  - Instant auto-approval for low-risk transactions.
  - Enhanced scrutiny / step-up verification for borderline transactions.
  - Trusted family guardian holds for vulnerable senior profiles or high-risk transfers.
  - Strict 5-minute operational clawback window authorization.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


CURRENT_POLICY_VERSION = "v2.4-STANDARD"


@dataclass
class PolicyDecision:
    policy_version: str
    decision: str  # "AUTO_APPROVE", "STEP_UP_VERIFY", "HOLD_FOR_FAMILY", "REJECT", "RECOVERY_LOCKED"
    decision_reason: str
    requires_family_approval: bool
    requires_soc_escalation: bool
    is_clawback_eligible: bool
    clawback_window_seconds: int
    rule_id: str
    suggested_status: str  # "APPROVED", "PENDING_FAMILY_APPROVAL", "FLAGGED", "HELD"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class PolicyEngine:
    """
    Guardian Risk Decision Engine.
    Takes the pure ML/statistical risk score and detection signals, applies
    configurable enterprise policy rules, and issues an authoritative decision.
    """

    def __init__(self, policy_version: str = CURRENT_POLICY_VERSION):
        self.policy_version = policy_version

    def evaluate(
        self,
        risk_score: int,
        risk_level: str,
        transaction: Dict[str, Any],
        customer_profile: Optional[Dict[str, Any]] = None,
        family_link: Optional[Dict[str, Any]] = None,
    ) -> PolicyDecision:
        amount = float(transaction.get("amount", 0.0))
        customer = customer_profile or {}
        is_senior = bool(customer.get("is_senior", False) or transaction.get("is_senior", False) or (transaction.get("elderly_age", 0) >= 60))
        signals = transaction.get("reasons", [])
        if isinstance(signals, str):
            try:
                signals = json.loads(signals)
            except Exception:
                signals = []

        is_new_payee = any("new payee" in str(s).lower() or "recipient novelty" in str(s).lower() for s in signals)
        is_impossible_speed = any("velocity" in str(s).lower() or "flight physics" in str(s).lower() or "impossible speed" in str(s).lower() for s in signals)
        scam_cat = transaction.get("scam_category", "CLEAN")

        # RULE 1: Ultra High Risk or Confirmed Scam Category -> Immediate Hold for Family or SOC
        if risk_score >= 80 or scam_cat in ["SENIOR_EXTORTION", "PUPPET_MULE_TRANSFER", "IMPOSSIBLE_TRAVEL"]:
            if is_senior or family_link is not None:
                return PolicyDecision(
                    policy_version=self.policy_version,
                    decision="HOLD_FOR_FAMILY",
                    decision_reason=(
                        f"Policy {self.policy_version} [POL-RULE-CRIT-01]: Severe risk score ({risk_score}/100) "
                        f"detected on protected account. Transaction immediately placed on security hold "
                        f"pending dual-authorization from assigned family guardian."
                    ),
                    requires_family_approval=True,
                    requires_soc_escalation=True,
                    is_clawback_eligible=True,
                    clawback_window_seconds=300,
                    rule_id="POL-RULE-CRIT-01",
                    suggested_status="PENDING_FAMILY_APPROVAL",
                )
            else:
                return PolicyDecision(
                    policy_version=self.policy_version,
                    decision="REJECT",
                    decision_reason=(
                        f"Policy {self.policy_version} [POL-RULE-CRIT-02]: Critical risk score ({risk_score}/100) "
                        f"exceeds organizational loss threshold. Payment blocked and escalated to Bank SOC."
                    ),
                    requires_family_approval=False,
                    requires_soc_escalation=True,
                    is_clawback_eligible=True,
                    clawback_window_seconds=300,
                    rule_id="POL-RULE-CRIT-02",
                    suggested_status="FLAGGED",
                )

        # RULE 2: High Risk (70-79)
        if risk_score >= 70:
            if is_senior and amount >= 2000.0:
                return PolicyDecision(
                    policy_version=self.policy_version,
                    decision="HOLD_FOR_FAMILY",
                    decision_reason=(
                        f"Policy {self.policy_version} [POL-RULE-HIGH-01]: High risk score ({risk_score}/100) "
                        f"on senior account with transaction value of ₹{amount:,.2f}. Family guardian review mandated."
                    ),
                    requires_family_approval=True,
                    requires_soc_escalation=False,
                    is_clawback_eligible=True,
                    clawback_window_seconds=300,
                    rule_id="POL-RULE-HIGH-01",
                    suggested_status="PENDING_FAMILY_APPROVAL",
                )
            return PolicyDecision(
                policy_version=self.policy_version,
                decision="HOLD_FOR_FAMILY",
                decision_reason=(
                    f"Policy {self.policy_version} [POL-RULE-HIGH-02]: High risk classification ({risk_score}/100). "
                    f"Holding transaction for security verification."
                ),
                requires_family_approval=True,
                requires_soc_escalation=True,
                is_clawback_eligible=True,
                clawback_window_seconds=300,
                rule_id="POL-RULE-HIGH-02",
                suggested_status="PENDING_FAMILY_APPROVAL",
            )

        # RULE 3: Medium Risk (35-69)
        if risk_score >= 35:
            # If high amount on senior account with new payee
            if is_senior and is_new_payee and amount >= 5000.0:
                return PolicyDecision(
                    policy_version=self.policy_version,
                    decision="HOLD_FOR_FAMILY",
                    decision_reason=(
                        f"Policy {self.policy_version} [POL-RULE-MED-01]: Elevated medium risk ({risk_score}/100) "
                        f"involving high-value transfer to first-time beneficiary on protected account."
                    ),
                    requires_family_approval=True,
                    requires_soc_escalation=False,
                    is_clawback_eligible=True,
                    clawback_window_seconds=300,
                    rule_id="POL-RULE-MED-01",
                    suggested_status="PENDING_FAMILY_APPROVAL",
                )
            return PolicyDecision(
                policy_version=self.policy_version,
                decision="STEP_UP_VERIFY",
                decision_reason=(
                    f"Policy {self.policy_version} [POL-RULE-MED-02]: Moderate anomaly score ({risk_score}/100). "
                    f"Requires secondary behavioral verification."
                ),
                requires_family_approval=False,
                requires_soc_escalation=False,
                is_clawback_eligible=False,
                clawback_window_seconds=0,
                rule_id="POL-RULE-MED-02",
                suggested_status="FLAGGED",
            )

        # RULE 4: Low Risk (< 35) -> Auto Approve
        return PolicyDecision(
            policy_version=self.policy_version,
            decision="AUTO_APPROVE",
            decision_reason=(
                f"Policy {self.policy_version} [POL-RULE-LOW-01]: Low risk score ({risk_score}/100). "
                f"Transaction satisfies all baseline behavioral, velocity, and geographic safety constraints."
            ),
            requires_family_approval=False,
            requires_soc_escalation=False,
            is_clawback_eligible=False,
            clawback_window_seconds=0,
            rule_id="POL-RULE-LOW-01",
            suggested_status="APPROVED",
        )
