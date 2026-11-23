import re
from typing import Dict, Any
from src.state import MindSpaceAgentState

# Deterministic crisis patterns across English, Hindi (Devanagari), and Hinglish (Roman Hindi).
# Bounded phrases are used to minimize false positives from colloquial speech.
# Note: Regex keyword detection acts as a deterministic first-line tripwire, not a comprehensive clinical guarantee.
CRISIS_PATTERNS = [
    # ── 1. English Indicators ──────────────────────────────────────────────────
    r"\bsuicide\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bwant to die\b",
    r"\bhang myself\b",
    r"\boverdose\b",
    r"\bself[- ]harm\b",
    r"\bhurt myself\b",

    # ── 2. Hinglish (Romanized Hindi) Indicators ──────────────────────────────
    r"\bjaan de dunga\b",
    r"\bjaan de dungi\b",
    r"\bjaan deni hai\b",
    r"\bmar jaana chahta hoon\b",
    r"\bmar jana chahta hoon\b",
    r"\bmar jaana chahti hoon\b",
    r"\bmar jana chahti hoon\b",
    r"\bmarne ka mann\b",
    r"\bkhudkushi\b",
    r"\baatmhatya\b",
    r"\batmahatya\b",
    r"\bkhud ko khatam\b",

    # ── 3. Hindi (Devanagari Script) Indicators ────────────────────────────────
    r"आत्महत्या",
    r"खुदकुशी",
    r"मरना चाहता",
    r"मरना चाहती",
    r"जान देना चाहता",
    r"जान देना चाहती",
    r"खुद को नुकसान",
    r"फांसी लगाना",
]

def safety_sentinel_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    if not messages:
        return {"is_crisis": False}
        
    last_text = messages[-1].get("content", "").lower()
    
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, last_text, re.IGNORECASE):
            return {
                "is_crisis": True,
                "messages": [{
                    "role": "assistant",
                    "content": "🚨 Immediate Support is Available (24/7 & Confidential)\n• Tele-MANAS: Call 14416\n• Emergency: Dial 112 or 988"
                }],
                "next_node": "END"
            }
    return {"is_crisis": False}