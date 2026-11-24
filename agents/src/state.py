from typing import TypedDict, Annotated, List, Optional, Dict, Any
import operator

class PeerCoveAgentState(TypedDict):
    session_id: str                              # Unique conversation session ID
    member_id: str                               # Logged-in user ID
    auth_token: Optional[str]                    # Bearer token for API verification
    
    # Annotated with operator.add ensures new messages are APPENDED to history
    messages: Annotated[List[Dict[str, Any]], operator.add]
    
    # Stepped-Care Level: 1 = Self-Help, 2 = Peer Listener, 3 = Clinical Crisis
    active_tier: int
    
    # Safety Circuit Breaker Metadata
    is_crisis: bool
    crisis_reason: Optional[str]
    
    # Human Peer Listener Match Metadata
    matched_listener_name: Optional[str]
    
    # Destination node for routing
    next_node: str