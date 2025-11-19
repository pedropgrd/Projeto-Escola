from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Disciplina(SQLModel, table=True):
    """
    Modelo de Disciplina do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "disciplina"
    
    id_disciplina: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(nullable=False, max_length=100)
    serie: str = Field(nullable=False, max_length=10)  # Ex: 5º, 6º, 7º
    turno: str = Field(nullable=False, max_length=20)  # Ex: Manhã, Tarde, Noite
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    turmas: List["Turma"] = Relationship(back_populates="disciplina")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Matemática",
                "serie": "5º",
                "turno": "Manhã"
            }
        }
