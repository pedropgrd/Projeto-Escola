from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Column, Enum as SQLEnum, Relationship

if TYPE_CHECKING:
    from app.models.aluno import Aluno
    from app.models.professor import Professor


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
    cpf: Optional[str] = Field(default=None, max_length=11, unique=True, index=True)
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
    
    # Relacionamentos
    aluno: Optional["Aluno"] = Relationship(back_populates="usuario")
    professor: Optional["Professor"] = Relationship(back_populates="usuario")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@escola.com",
                "cpf": "12345678900",
                "perfil": "ADMIN"
            }
        }
