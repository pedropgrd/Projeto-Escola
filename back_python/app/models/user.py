from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field, Column, Enum as SQLEnum


class UserRole(str, Enum):
    """Enum para definir os perfis de usuário do sistema"""
    ADMIN = "ADMIN"
    PROFESSOR = "PROFESSOR"
    ALUNO = "ALUNO"


class User(SQLModel, table=True):
    """
    Modelo de Usuário do sistema
    
    Suporta 3 perfis: ADMIN, PROFESSOR e ALUNO
    Implementa soft delete através do campo ativo
    """
    __tablename__ = "usuarios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    nome_completo: str = Field(nullable=False)
    senha_hash: str = Field(nullable=False)
    
    # Perfil do usuário usando Enum
    perfil: UserRole = Field(
        sa_column=Column(SQLEnum(UserRole), nullable=False),
        default=UserRole.ALUNO
    )
    
    # Soft delete - usuário inativo não pode fazer login
    ativo: bool = Field(default=True)
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = Field(default=None)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@escola.com",
                "nome_completo": "Administrador do Sistema",
                "perfil": "ADMIN"
            }
        }
