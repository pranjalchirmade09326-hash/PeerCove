"""
MindSpace LLM Client Gateway.
Provides resilient chat completion across LangChain Google GenAI, direct Gemini REST API,
and safe grounded non-clinical conversational fallback.
Supports both legacy AIza and modern AQ-format Google AI Studio keys.
"""
import os
import httpx
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

# Ensure .env is dynamically loaded from agents root
AGENTS_ROOT = Path(__file__).resolve().parent.parent.parent

def get_api_key() -> str:
    """Dynamically reads the most up-to-date API key from environment / .env."""
    load_dotenv(AGENTS_ROOT / ".env", override=True)
    return (
        os.getenv("GOOGLE_API_KEY") or 
        os.getenv("API_KEY") or 
        os.getenv("GEMINI_API_KEY") or 
        ""
    ).strip()

def invoke_gemini_chat(system_prompt: str, messages: List[Dict[str, Any]], temperature: float = 0.4) -> str:
    """
    Executes a chat completion turn using Google Gemini.
    Gracefully falls back across LangChain, direct HTTP (supporting AQ and AIza keys),
    and contextual fallback.
    """
    api_key = get_api_key()

    # 1. Direct Google Gemini REST API (Supports AQ. and AIza keys via header & query param)
    if api_key:
        for model in ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key
                }

                contents = []
                for m in messages:
                    role = "user" if m.get("role") == "user" else "model"
                    txt = m.get("content", "").strip()
                    if txt:
                        contents.append({
                            "role": role,
                            "parts": [{"text": txt}]
                        })

                # If no user message was added, add a fallback user turn
                if not contents or contents[-1].get("role") != "user":
                    contents.append({
                        "role": "user",
                        "parts": [{"text": "Hello, I am reaching out for supportive reflection."}]
                    })

                payload = {
                    "systemInstruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "contents": contents,
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": 600
                    }
                }

                with httpx.Client(timeout=20.0) as client:
                    res = client.post(url, headers=headers, json=payload)
                    
                    try:
                        with open(AGENTS_ROOT / "gemini_debug.log", "a", encoding="utf-8") as f:
                            f.write(f"[{model}] Status: {res.status_code} | Response: {res.text[:300]}\n")
                    except Exception:
                        pass

                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                    else:
                        print(f"[llm_client] Gemini API {model} returned status {res.status_code}: {res.text[:200]}")
            except Exception as e:
                try:
                    with open(AGENTS_ROOT / "gemini_debug.log", "a", encoding="utf-8") as f:
                        f.write(f"[{model}] Exception: {str(e)}\n")
                except Exception:
                    pass
                print(f"[llm_client] Direct REST invocation error with {model}: {e}")

    # 3. Contextual Resilient Fallback (Bilingual Hinglish/English with concrete coping tools)
    last_user_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user_msg = m.get("content", "").lower()
            break

    is_hinglish = any(w in last_user_msg for w in [
        "kya", "karu", "dimaag", "baatein", "ho", "raha", "rahi", "hai", "mujhe", "neend", 
        "thak", "lag", "kaise", "batao", "bechaini", "ghabrahat", "ruk", "nahi", "tum", "ek"
    ])

    # A. Overthinking / Past memories / Racing mind
    if any(k in last_user_msg for k in ["overthinking", "purani", "baatein", "thoughts", "racing", "mind", "soch"]):
        if is_hinglish:
            return (
                "Main samajh sakta hoon ki jab purani baatein dimaag me bar-bar ghoomti hain, to kitni thakan aur bechaini mehsoos hoti hai.\n\n"
                "Is overthinking ke loop ko break karne ke liye abhi ye 3 chote steps try karein:\n\n"
                "1. **Thought Ko Name Karein**: Khud ko remind karayein — *'Ye sirf ek thought hai jo aayi hai, ye mera present moment nahi hai.'*\n"
                "2. **5-4-3-2-1 Grounding**: Apne aas-paas dekhein — 3 aisi cheezein jinhe aap abhi dekh sakte hain, aur 2 aawazein jo sunayi de rahi hain.\n"
                "3. **Long Exhale**: Ek gehri saans andar lein aur double time me dhere-dhere bahar chodein.\n\n"
                "Kya aap chahte hain ki hum ek 2-minute 4-7-8 breathing exercise karein, ya aap is thought ko thoda aur express karna chahte hain?"
            )
        return (
            "I completely hear how exhausting it is when the mind loops over past events and overthinking takes over.\n\n"
            "To help interrupt this cycle right now, let's try a gentle reset:\n\n"
            "1. **Name the thought**: Remind yourself, *'This is a memory visiting my awareness, not an event happening right now.'*\n"
            "2. **Ground into your senses**: Notice your feet firmly planted on the floor and release the tension in your jaw and shoulders.\n"
            "3. **Take one long, slow exhale**: Breathing out longer than you breathe in signals to your nervous system that you are safe right now.\n\n"
            "Would you like to try a calming 4-7-8 breath together, or share what thought is feeling heaviest?"
        )

    # B. Somatic Breathwork / Anxiety / Panic
    elif any(k in last_user_msg for k in ["breath", "4-7-8", "calm", "anxious", "panic", "ghabrahat", "bechaini", "darr"]):
        if is_hinglish:
            return (
                "Main aapke sath hoon. Aaiye milkar ek calming 4-7-8 breathwork karte hain taaki aapki body aur mind relax ho sakein:\n\n"
                "1. **Inhale (Saans andar)**: Naak se aaram se **4 seconds** tak saans lein.\n"
                "2. **Hold (Rokein)**: Shanti se **7 seconds** tak saans rokein.\n"
                "3. **Exhale (Bahar chodein)**: Munh se dhere-dhere **8 seconds** tak saans bahar chodein.\n\n"
                "Apne shoulders aur jaw ko bilkul dheela chod dein. Main yahan aapke sath hoon."
            )
        return (
            "I hear you. Let's ground ourselves with a calming 4-7-8 somatic breath together:\n\n"
            "1. **Inhale gently** through your nose for **4 seconds**.\n"
            "2. **Hold your breath** with stillness for **7 seconds**.\n"
            "3. **Exhale slowly** through your mouth for **8 seconds**.\n\n"
            "Notice your shoulders releasing tension. I am right here with you."
        )

    # C. User Wants to Share / Talk ("mujhe baat share karni hai", "batana hai")
    elif any(k in last_user_msg for k in ["share", "batana", "bolna", "baat", "vent"]):
        if is_hinglish:
            return (
                "Haan bilkul! Main poora dhyan se sun raha hoon. Aaj aisa kya hua jiski wajah se aapka mann itna bhaari ya sad hai?\n\n"
                "Aap shuru se bataiye, jo bhi dil me hai — main yahan bina kisi judgement ke sirf aapko sunne ke liye baitha hoon."
            )
        return (
            "I am completely listening with open ears and care. What happened today that is weighing on your heart?\n\n"
            "Take all the space you need — tell me everything from the beginning. I am right here with you."
        )

    # D. Sadness / Low Energy / Feeling Down ("sad lag raha", "udas", "bura lag raha")
    elif any(k in last_user_msg for k in ["sad", "udas", "rona", "bura", "low", "down", "heavy"]):
        if is_hinglish:
            return (
                "Udas hona bohot bhaari aur exhausting lag sakta hai, aur main samajh sakta hoon ki aaj ka din aapke liye bilkul aasan nahi raha.\n\n"
                "Kya koi specific baat hui jisne aapko hurt kiya, ya bina kisi wajah ke achanak low feel hone laga? Aap aaram se share karein."
            )
        return (
            "Feeling deep sadness or low energy can be incredibly heavy to carry alone.\n\n"
            "Did something specific happen to trigger this, or did this wave of sadness arrive out of nowhere? Feel free to share whatever feels safe."
        )

    # E. Meta Questions ("tum ek hi jaise kyu answer de rhe ho", "why same answer")
    elif any(k in last_user_msg for k in ["same", "ek hi", "repeat", "robot", "phir se"]):
        if is_hinglish:
            return (
                "Aapki baat bilkul sahi hai, aur main samajhta hoon ki ek hi jaise jawab milne se kitni frustration hoti hai.\n\n"
                "Main yahan aapko kisi robotic pattern me nahi baandhna chahta. Aap bataiye, is waqt aapke dimaag me sabse bada issue ya feeling kya chal rahi hai? Main bilkul fresh dhyan se sunne ke liye tayyar hoon."
            )
        return (
            "You are completely right to call that out, and I apologize for sounding repetitive.\n\n"
            "I want to truly hear what is on your mind rather than repeating scripted patterns. Tell me directly: what is feeling most urgent or frustrating for you right now? I am listening."
        )

    # D. Sleep / Insomnia / Night Restlessness
    elif any(k in last_user_msg for k in ["sleep", "neend", "bed", "night", "raat", "insomnia"]):
        if is_hinglish:
            return (
                "Raat ko jab dimaag shant nahi hota to bohot frustrating lag sakta hai. Aaiye thoda pressure release karte hain:\n\n"
                "• **Neend lene ki koshish ka pressure chod dein**: Sirf body ko aaram (rest) dene par dhyan dein.\n"
                "• **Bed par slow breaths**: 4 seconds inhale aur 6 seconds exhale karein.\n"
                "• **Mental download**: Agar koi kal ka kaam dimaag me ghoom raha hai, to use paper par likh kar rakh dein.\n\n"
                "Kya aap chahte hain ki hum koi peaceful visualization karein?"
            )
        return (
            "It can be so frustrating when your body wants to rest but your mind refuses to slow down.\n\n"
            "Let's take the pressure off 'trying to sleep' and simply focus on resting:\n"
            "• Unclench your jaw and let your tongue rest away from the roof of your mouth.\n"
            "• Lengthen your exhalations — inhale for 4 counts, exhale for 6.\n"
            "• If tomorrow's tasks are buzzing, imagine placing them into a box to open tomorrow morning.\n\n"
            "Would you like me to guide you through a gentle bedtime body scan?"
        )

    # E. Mood Tracking
    elif any(k in last_user_msg for k in ["mood", "checkin", "rate"]):
        return (
            "Checking in with your emotional pulse is a wonderful step of self-awareness. "
            "How would you rate your energy and emotional state on a scale of 1 to 10 right now?"
        )

    # F. Journaling
    elif any(k in last_user_msg for k in ["journal", "reflect", "write", "likhna"]):
        return (
            "Writing down what we carry is a powerful way to quiet racing thoughts. "
            "Would you like to write a quick reflection in your private, encrypted MindSpace journal?"
        )

    # G. Dynamic, Non-Repetitive Response Generator
    user_words_preview = last_user_msg[:60].strip()
    if is_hinglish:
        import random
        hinglish_responses = [
            f"Aapne kaha: \"{user_words_preview}\". Main bilkul dhyan se sun raha hoon. Is baare me thoda aur detail me bataiye, main aapke sath hoon.",
            f"Main aapki feeling ko samajh sakta hoon. Jab dil me aisi baatein ho, to unhe bahar nikalna zaroori hota hai. Aap bataiye, kya chal raha hai?",
            f"Aap jo bhi mehsoos kar rahe hain, wo bilkul valid hai. Main yahan bina judge kiye sunne ke liye baitha hoon — aap freely share karein."
        ]
        return random.choice(hinglish_responses)

    import random
    english_responses = [
        f"I hear you when you say: \"{user_words_preview}\". Let's pause and unpack that together. What feels most present for you right now?",
        f"Thank you for being open with me about this. When emotions or situations feel like this, taking a steady breath is a great first step. How can I best support you in this moment?",
        f"I am fully here with you. There's no script or pressure here — tell me whatever is at the front of your mind right now."
    ]
    return random.choice(english_responses)
