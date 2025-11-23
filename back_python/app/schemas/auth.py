from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class Token(BaseModel):
    """Schema de resposta do token JWT"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }


class TokenData(BaseModel):
    """
    Schema com os dados contidos no token JWT (scopes)
    
    Estes dados são extraídos do access_token após a autenticação
    """
    user_id: int
    email: str
    cpf: Optional[str] = None
    perfil: str
    data_acesso: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "email": "admin@escola.com",
                "cpf": "12345678900",
                "perfil": "ADMIN",
                "data_acesso": "2025-11-19T10:30:00"
            }
        }


class TokenRefresh(BaseModel):
    """Schema para refresh de token"""
    refresh_token: str


class LoginRequest(BaseModel):
    """Schema de requisição de login"""
    email: EmailStr
    senha: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@escola.com",
                "senha": "senha123"
            }
        }
