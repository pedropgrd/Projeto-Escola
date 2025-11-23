from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Professor(SQLModel, table=True):
    """
    Modelo de Professor do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "professor"
    
    id_professor: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: Optional[int] = Field(default=None, foreign_key="usuarios.id", unique=True)
    nome: str = Field(nullable=False, max_length=150)
    cpf: str = Field(unique=True, index=True, nullable=False, max_length=14)
    endereco: Optional[str] = Field(default=None, max_length=255)
    telefone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    usuario: Optional["User"] = Relationship(back_populates="professor")
    turmas: List["Turma"] = Relationship(back_populates="professor")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Maria Oliveira Costa",
                "cpf": "987.654.321-00",
                "endereco": "Av. Principal, 456",
                "telefone": "0000000000",
                "email": "maria.oliveira@escola.com"
            }
        }
