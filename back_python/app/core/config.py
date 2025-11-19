from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Configurações da aplicação carregadas de variáveis de ambiente
    """
    # Database
    DATABASE_URL: str
    
    # JWT e Segurança
    SECRET_KEY: str
    API_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Tempo de expiração do refresh token em horas (troca: antes era em dias)
    REFRESH_TOKEN_EXPIRE_HOURS: int = 4
    
    # Application
    APP_NAME: str = "Sistema de Gerenciamento Escolar - CETA Trajano"
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
