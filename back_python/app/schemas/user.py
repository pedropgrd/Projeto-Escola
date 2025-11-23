from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    """Schema base para usuário"""
    model_config = ConfigDict(use_enum_values=False)
    
    email: EmailStr
    perfil: UserRole = UserRole.ALUNO
    cpf: Optional[str] = Field(None, min_length=11, max_length=11, pattern="^[0-9]{11}$")


class UserCreate(UserBase):
    """Schema para criação de usuário (Sign-up) - Apenas ADMIN pode criar"""
    model_config = ConfigDict(
        use_enum_values=False,
        json_schema_extra={
            "example": {
                "email": "aluno@escola.com",
                "perfil": "ALUNO",
                "cpf": "12345678900",
                "senha": "senha123"
            }
        }
    )
    
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


class UserUpdate(BaseModel):
    """Schema para atualização de usuário"""
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, min_length=11, max_length=11, pattern="^[0-9]{11}$")
    senha: Optional[str] = Field(None, min_length=6, max_length=72)
    ativo: Optional[bool] = None


class UserResponse(UserBase):
    """Schema de resposta de usuário (sem dados sensíveis)"""
    model_config = ConfigDict(
        use_enum_values=False,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "email": "aluno@escola.com",
                "cpf": "12345678900",
                "perfil": "ALUNO",
                "ativo": True,
                "criado_em": "2025-01-01T10:00:00",
                "atualizado_em": None
            }
        }
    )
    
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None


class UserInDB(UserResponse):
    """Schema completo do usuário (incluindo password hash)"""
    senha_hash: str
