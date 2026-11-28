"""
Support Pathway Agent Node (Stepped-Care Triage & Tier Assignment).

Evaluates member distress signals and explicit preferences to assign
Tier 1 (AI-Guided Self-Help), Tier 2 (Volunteer Peer Support), or
Tier 3 (Care Coordination & Professional Navigation).
"""
from src.state import PeerCoveAgentState
from src.nodes.llm_client import call_llm_with_fallback


def pathway_node(state: PeerCoveAgentState) -> dict:
    """Evaluates distress severity and preferences to recommend a stepped-care pathway."""
    messages = state.get("messages", [])
    last_user = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user = m.get("content", "").lower()
            break

    if any(k in last_user for k in ["therapist", "doctor", "counselor", "clinical", "appointment", "schedule"]):
        tier = 3
        next_step = "coordination"
    elif any(k in last_user for k in ["listener", "peer", "human", "someone to talk"]):
        tier = 2
        next_step = "peer_matcher"
    else:
        tier = 1
        next_step = "companion"

    system_prompt = (
        "You are PeerCove's Support Pathway Agent. Briefly and warmly explain the recommended "
        f"Stepped-Care option (Tier {tier}) in 2-3 non-diagnostic sentences, reminding the member "
        "they are always in control of choosing self-help, peer support, or scheduled care."
    )
    reply_text = call_llm_with_fallback(system_prompt, messages)

    return {
        "active_tier": tier,
        "next_node": next_step,
        "messages": [{"role": "assistant", "content": reply_text}],
    }
