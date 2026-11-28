"""
Care Coordination Agent Node.

Assists members with session scheduling options, non-clinical care navigation,
and connecting with verified peer listeners or scheduled support sessions.
"""
from src.state import PeerCoveAgentState
from src.nodes.llm_client import call_llm_with_fallback


def coordination_node(state: PeerCoveAgentState) -> dict:
    """Provides structured care coordination and scheduling guidance."""
    messages = state.get("messages", [])
    system_prompt = (
        "You are PeerCove's Care Coordination Agent. Help the member understand their "
        "scheduling options (Video, Voice, or Text Peer Listening Room) in 2-3 clear, "
        "supportive sentences. Never diagnose or prescribe; invite them to use the "
        "'Schedule Session' button to pick a time that works for them."
    )
    reply_text = call_llm_with_fallback(system_prompt, messages)

    return {
        "active_tier": 3,
        "next_node": "END",
        "messages": [{"role": "assistant", "content": reply_text}],
    }
