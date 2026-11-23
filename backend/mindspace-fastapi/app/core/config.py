from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional, Union
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindSpace Core API"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", 8080))
    
    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql+asyncpg://mindspace:dev-only-change-me@localhost:5433/mindspace"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not v:
            return v
        url = str(v).strip()
        # Convert standard Postgres connection URLs (e.g. from Neon, Render, Supabase) to asyncpg dialect
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Map sslmode query parameter to ssl for asyncpg
        if "sslmode=require" in url:
            url = url.replace("sslmode=require", "ssl=require")
        return url
    
    # AES-256-GCM Envelope Encryption (32-byte base64 key)
    INTAKE_ENCRYPTION_KEYS_JSON: str = '{"v1":"q2xePGHE57EuQkCoRMXPPz1zJsqpDGoqgTnImucQ1MY="}'
    INTAKE_CURRENT_ENCRYPTION_KEY_VERSION: str = "v1"
    
    # Auth
    AUTH_ISSUER: str = "http://localhost:5001"
    AUTH_AUDIENCE: str = "mindspace-api"
    AUTH_JWKS_URL: str = "http://localhost:5001/api/auth/jwks"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings()

