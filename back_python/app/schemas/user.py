from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole


class UserBase(BaseModel):
    """Schema base para usuário"""
    email: EmailStr
    nome_completo: str = Field(min_length=3, max_length=100)
    perfil: UserRole = UserRole.ALUNO


class UserCreate(UserBase):
    """Schema para criação de usuário (Sign-up) - Apenas ADMIN pode criar"""
    senha: str = Field(min_length=6, max_length=72)
    
    @field_validator('senha')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida a força da senha"""
        if len(v) < 6:
            raise ValueError('Senha deve ter no mínimo 6 caracteres')
        if len(v) > 72:
            raise ValueError('Senha deve ter no máximo 72 caracteres (limite do bcrypt)')
        if not any(char.isdigit() for char in v):
            raise ValueError('Senha deve conter pelo menos um número')
        if not any(char.isalpha() for char in v):
            raise ValueError('Senha deve conter pelo menos uma letra')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "aluno@escola.com",
                "nome_completo": "João Silva",
                "perfil": "ALUNO",
                "senha": "senha123"
            }
        }


class UserUpdate(BaseModel):
    """Schema para atualização de usuário"""
    nome_completo: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    senha: Optional[str] = Field(None, min_length=6, max_length=72)
    ativo: Optional[bool] = None


class UserResponse(UserBase):
    """Schema de resposta de usuário (sem dados sensíveis)"""
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "aluno@escola.com",
                "nome_completo": "João Silva",
                "perfil": "ALUNO",
                "ativo": True,
                "criado_em": "2025-01-01T10:00:00",
                "atualizado_em": None
            }
        }


class UserInDB(UserResponse):
    """Schema completo do usuário (incluindo password hash)"""
    senha_hash: str
