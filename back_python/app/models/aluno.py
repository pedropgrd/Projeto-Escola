from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Aluno(SQLModel, table=True):
    """
    Modelo de Aluno do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "aluno"
    
    id_aluno: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: int = Field(foreign_key="usuarios.id", unique=True, nullable=False)
    matricula: str = Field(unique=True, index=True, nullable=False, max_length=20)
    nome: str = Field(nullable=False, max_length=150)
    cpf: str = Field(unique=True, index=True, nullable=False, max_length=14)
    data_nascimento: Optional[date] = None
    endereco: Optional[str] = Field(default=None, max_length=255)
    telefone: Optional[str] = Field(default=None, max_length=20)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    usuario: Optional["User"] = Relationship(back_populates="aluno")
    turmas: List["AlunoTurma"] = Relationship(back_populates="aluno")
    
    class Config:
        json_schema_extra = {
            "example": {
                "matricula": "2025001",
                "nome": "João Silva Santos",
                "cpf": "12345678800",
                "data_nascimento": "2010-05-15",
                "endereco": "Rua das Flores, 123",
                "telefone": "11987654321"
            }
        }
