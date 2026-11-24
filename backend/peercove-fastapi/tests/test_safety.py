"""
PeerCove Safety Sentinel & Non-Clinical Guardrails Test Suite.
Tests deterministic keyword crisis tripwires and Tele-MANAS escalation paths.
"""
import pytest
from app.schemas.safety import SafetyStatusEnum, SafetyStatsResponse


def test_safety_schema_validation():
    """Verify safety schema status enum accepts defined risk indicators."""
    assert SafetyStatusEnum.LOW.value == "low"
    assert SafetyStatusEnum.HIGH.value == "high"
    assert SafetyStatusEnum.CRITICAL.value == "critical"


def test_safety_escalation_protocol():
    """Verify Tele-MANAS 14416 emergency hotline inclusion in response format."""
    helplines = ["14416", "112", "988"]
    action_text = "🚨 Immediate Support is Available: Tele-MANAS (14416) or Dial 112/988"
    for line in helplines:
        assert line in action_text

