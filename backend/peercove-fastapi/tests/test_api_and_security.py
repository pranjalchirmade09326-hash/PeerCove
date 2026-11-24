from app.core import security
from app.core.security import encrypt_content, decrypt_content, get_encryption_keys
import jwt

def test_encryption_roundtrip():
    original_text = "PeerCove confidential emotional reflection note"
    packed, key_ver = encrypt_content(original_text)
    assert packed is not None
    assert key_ver == security.CURRENT_KEY_VERSION
    
    decrypted = decrypt_content(packed, key_ver)
    assert decrypted == original_text

    # Empty plaintext roundtrip verification
    empty_packed, empty_ver = encrypt_content("")
    assert len(empty_packed) == 28
    assert decrypt_content(empty_packed, empty_ver) == ""

def test_decryption_invalid():
    assert decrypt_content(None, "v1") is None
    assert decrypt_content(b"too_short", "v1") is None

def test_encryption_keys():
    keys = get_encryption_keys()
    assert security.CURRENT_KEY_VERSION in keys
    assert len(keys[security.CURRENT_KEY_VERSION]) == 32

def test_token_decoding_logic():
    token = jwt.encode({"sub": "usr-custom-member-42"}, "secret_key_at_least_32_bytes_long_peercove_secret", algorithm="HS256")
    unverified = jwt.decode(token, options={"verify_signature": False})
    assert unverified.get("sub") == "usr-custom-member-42"
