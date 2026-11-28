"""
LangGraph Central Orchestrator State Graph.
Connects all subagent nodes with conditional state routing.
"""
import sys
from pathlib import Path

# Ensure agents directory is in sys.path
agents_dir = str(Path(__file__).resolve().parent.parent)
if agents_dir not in sys.path:
    sys.path.insert(0, agents_dir)

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from src.state import PeerCoveAgentState
from src.nodes.safety_sentinel import safety_sentinel_node
from src.nodes.intake_agent import intake_node
from src.nodes.pathway_agent import pathway_node
from src.nodes.companion_agent import companion_node
from src.nodes.matcher_agent import matcher_node
from src.nodes.coordination_agent import coordination_node
from src.nodes.followup_agent import followup_node

def route_next_node(state: PeerCoveAgentState) -> str:
    """Evaluates state conditions to determine the next subagent node."""
    # 1. Immediate exit if safety sentinel tripped
    if state.get("is_crisis"):
        return END
        
    last_user_text = ""
    for m in reversed(state.get("messages", [])):
        if m.get("role") == "user":
            last_user_text = m.get("content", "").lower()
            break
            
    # 2. Stepped-care triage routing across all specialized subagents
    if any(k in last_user_text for k in ["talk to human", "peer listener", "real person", "call someone", "volunteer"]):
        return "peer_matcher"
    elif any(k in last_user_text for k in ["schedule", "book", "appointment", "therapist", "doctor", "slot"]):
        return "coordination"
    elif any(k in last_user_text for k in ["follow up", "followup", "check-in", "checkin", "goal", "progress", "mood"]):
        return "followup"
    elif any(k in last_user_text for k in ["pathway", "options", "next step", "recommend", "tier"]):
        return "pathway"
    elif any(k in last_user_text for k in ["breathe", "grounding", "journal", "reflection", "calm", "anxious", "overwhelm"]):
        return "companion"
    else:
        return "intake"

# Initialize StateGraph with the shared state schema
graph_builder = StateGraph(PeerCoveAgentState)

# Register all 7 Subagent Nodes
graph_builder.add_node("safety_sentinel", safety_sentinel_node)
graph_builder.add_node("intake", intake_node)
graph_builder.add_node("pathway", pathway_node)
graph_builder.add_node("companion", companion_node)
graph_builder.add_node("peer_matcher", matcher_node)
graph_builder.add_node("coordination", coordination_node)
graph_builder.add_node("followup", followup_node)

# Set Entry Point
graph_builder.set_entry_point("safety_sentinel")

# Define Conditional Edges from Safety Sentinel
graph_builder.add_conditional_edges(
    "safety_sentinel",
    route_next_node,
    {
        END: END,
        "peer_matcher": "peer_matcher",
        "coordination": "coordination",
        "followup": "followup",
        "pathway": "pathway",
        "companion": "companion",
        "intake": "intake"
    }
)

# Connect Workers to End of Cycle
graph_builder.add_edge("intake", END)
graph_builder.add_edge("pathway", END)
graph_builder.add_edge("companion", END)
graph_builder.add_edge("peer_matcher", END)
graph_builder.add_edge("coordination", END)
graph_builder.add_edge("followup", END)

# Compile with MemorySaver checkpointer for stateful session resumability
checkpointer = MemorySaver()
orchestrator_app = graph_builder.compile(checkpointer=checkpointer)