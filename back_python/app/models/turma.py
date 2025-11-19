from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Turma(SQLModel, table=True):
    """
    Modelo de Turma do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "turma"
    
    id_turma: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(nullable=False, max_length=100)  # Ex: 5º A, 7º B
    ano_letivo: int = Field(nullable=False)
    id_professor: int = Field(foreign_key="professor.id_professor", nullable=False)
    id_disciplina: int = Field(foreign_key="disciplina.id_disciplina", nullable=False)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    professor: Optional["Professor"] = Relationship(back_populates="turmas")
    disciplina: Optional["Disciplina"] = Relationship(back_populates="turmas")
    alunos: List["AlunoTurma"] = Relationship(back_populates="turma")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "5º A",
                "ano_letivo": 2025,
                "id_professor": 1,
                "id_disciplina": 1
            }
        }
