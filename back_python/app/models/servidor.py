from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Servidor(SQLModel, table=True):
    """
    Modelo de Servidor do sistema (Funcionários administrativos, secretaria, inspeção, etc.)
    Implementa soft delete através do campo ativo
    """
    __tablename__ = "servidor"
    
    id_servidor: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: Optional[int] = Field(default=None, foreign_key="usuarios.id", unique=True)
    nome: str = Field(nullable=False, max_length=150)
    cpf: str = Field(unique=True, index=True, nullable=False, max_length=14)
    email: Optional[str] = Field(default=None, max_length=100)
    telefone: Optional[str] = Field(default=None, max_length=20)
    endereco: Optional[str] = Field(default=None, max_length=255)
    funcao: Optional[str] = Field(default=None, max_length=100)
    
    # Soft delete
    ativo: bool = Field(default=True)
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    usuario: Optional["User"] = Relationship(back_populates="servidor")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Ana Paula Souza",
                "cpf": "11122233344",
                "email": "ana.souza@escola.com",
                "telefone": "11987654321",
                "endereco": "Rua das Acácias, 789",
                "funcao": "Secretária"
            }
        }
