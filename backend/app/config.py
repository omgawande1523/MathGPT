import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = Field(default="MathGPT Enterprise")
    DEBUG: bool = Field(default=True)
    API_V1_STR: str = Field(default="/api/v1")
    SECRET_KEY: str = Field(default="enterprise_super_secret_jwt_key_mathgpt_2026_symbols")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # PostgreSQL Settings
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_USER: str = Field(default="mathgpt_admin")
    POSTGRES_PASSWORD: str = Field(default="mathgpt_secure_pass_9988")
    POSTGRES_DB: str = Field(default="mathgpt_prod")
    POSTGRES_PORT: int = Field(default=5432)
    DATABASE_URL: str = Field(default="postgresql://mathgpt_admin:mathgpt_secure_pass_9988@localhost:5432/mathgpt_prod")

    # Redis Settings
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")

    # Qdrant Settings
    QDRANT_HOST: str = Field(default="localhost")
    QDRANT_PORT: int = Field(default=6333)
    QDRANT_API_KEY: str = Field(default="qdrant_secure_api_key_2026")

    # Neo4j Settings
    NEO4J_URI: str = Field(default="bolt://localhost:7687")
    NEO4J_USER: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(default="neo4j_secure_pass_7788")

    # Model Keys
    OPENAI_API_KEY: str = Field(default="sk-placeholder")
    GEMINI_API_KEY: str = Field(default="placeholder")
    ANTHROPIC_API_KEY: str = Field(default="sk-placeholder")
    DEEPSEEK_API_KEY: str = Field(default="sk-placeholder")

    # Paths
    LEAN_PATH: str = Field(default="lean")
    SAGEMATH_PATH: str = Field(default="sage")
    PYTHON_EXEC: str = Field(default="python")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
