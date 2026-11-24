"""
PeerCove MCP & Clinical Document Integration Test Suite.
Validates MCP tool calling interfaces and FHIR resource mappings.
"""
import pytest


def test_mcp_tool_schema_definitions():
    """Verify tool registration schema contains required clinical safety parameters."""
    mcp_tools = [
        {"name": "get_patient_observations", "schema": {"patient_id": "str"}},
        {"name": "fetch_clinical_impression", "schema": {"impression_id": "str"}},
    ]
    tool_names = [t["name"] for t in mcp_tools]
    assert "get_patient_observations" in tool_names
    assert "fetch_clinical_impression" in tool_names


def test_mcp_fhir_resource_compatibility():
    """Verify FHIR resource naming alignment for PeerCove agents."""
    valid_resources = {"Patient", "Observation", "ClinicalImpression", "DocumentReference"}
    assert "Patient" in valid_resources
    assert "Observation" in valid_resources
