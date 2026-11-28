"""
Autonomous Follow-up Agent Node.

Supports longitudinal mood check-ins, personal wellbeing goal progress,
and gentle reflection continuity across sessions.
"""
from src.state import PeerCoveAgentState
from src.nodes.llm_client import call_llm_with_fallback


def followup_node(state: PeerCoveAgentState) -> dict:
    """Guides member check-ins, goal progress, and continuity follow-ups."""
    messages = state.get("messages", [])
    system_prompt = (
        "You are PeerCove's Follow-up & Continuity Agent. Warmly check in on the member's "
        "recent mood, sleep, or personal wellbeing goals in 2-3 supportive sentences, and "
        "invite them to log a quick mood pulse or journal reflection if they'd like."
    )
    reply_text = call_llm_with_fallback(system_prompt, messages)

    return {
        "active_tier": state.get("active_tier", 1),
        "next_node": "END",
        "messages": [{"role": "assistant", "content": reply_text}],
    }
