from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# ALUNO_TURMA SCHEMAS
# ============================================

class AlunoTurmaBase(BaseModel):
    """Schema base para AlunoTurma"""
    id_aluno: int = Field(gt=0, description="ID do aluno")
    id_turma: int = Field(gt=0, description="ID da turma")


class AlunoTurmaCreate(AlunoTurmaBase):
    """Schema para criação de AlunoTurma - Matricular aluno em turma"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_aluno": 1,
                "id_turma": 1
            }
        }


class AlunoTurmaResponse(AlunoTurmaBase):
    """Schema de resposta de AlunoTurma"""
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "id_aluno": 1,
                "id_turma": 1,
                "criado_em": "2025-02-01T10:00:00",
                "atualizado_em": None
            }
        }


class AlunoTurmaListResponse(BaseModel):
    """Schema para listagem paginada de Alunos em Turmas"""
    items: list[AlunoTurmaResponse]
    total: int
    offset: int
    limit: int
