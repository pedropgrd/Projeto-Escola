from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class AlunoTurma(SQLModel, table=True):
    """
    Modelo de relacionamento N:N entre Aluno e Turma
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "aluno_turma"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    id_aluno: int = Field(foreign_key="aluno.id_aluno", nullable=False)
    id_turma: int = Field(foreign_key="turma.id_turma", nullable=False)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    aluno: Optional["Aluno"] = Relationship(back_populates="turmas")
    turma: Optional["Turma"] = Relationship(back_populates="alunos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_aluno": 1,
                "id_turma": 1
            }
        }
