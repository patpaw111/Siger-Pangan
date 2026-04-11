"""Konfigurasi dari environment variables."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GRPC_PORT: int = 50051
    HTTP_PORT: int = 8000
    ENVIRONMENT: str = "development"
    NLP_MODEL: str = "xx_ent_wiki_sm"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
