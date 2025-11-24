from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import TurnoEnum


# ============================================
# TURMA SCHEMAS
# ============================================

class TurmaBase(BaseModel):
    """Schema base para Turma"""
    nome: str = Field(min_length=1, max_length=100, description="Ex: 5º A, 7º B")
    serie: str = Field(min_length=1, max_length=20, description="Ex: 5º Ano, 6º Ano")
    turno: TurnoEnum = Field(description="Turno da turma: MANHA, TARDE ou NOITE")
    ano_letivo: int = Field(gt=2000, lt=2100, description="Ano letivo da turma")
    id_professor: int = Field(gt=0, description="ID do professor responsável")
    id_disciplina: int = Field(gt=0, description="ID da disciplina")


class TurmaCreate(TurmaBase):
    """Schema para criação de Turma - Apenas ADMIN pode criar"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "5º A",
                "serie": "5º Ano",
                "turno": "MANHA",
                "ano_letivo": 2025,
                "id_professor": 1,
                "id_disciplina": 1
            }
        }


class TurmaUpdate(BaseModel):
    """Schema para atualização de Turma"""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    serie: Optional[str] = Field(None, min_length=1, max_length=20)
    turno: Optional[TurnoEnum] = None
    ano_letivo: Optional[int] = Field(None, gt=2000, lt=2100)
    id_professor: Optional[int] = Field(None, gt=0)
    id_disciplina: Optional[int] = Field(None, gt=0)


class TurmaResponse(TurmaBase):
    """Schema de resposta de Turma"""
    id_turma: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_turma": 1,
                "nome": "5º A",
                "serie": "5º Ano",
                "turno": "MANHA",
                "ano_letivo": 2025,
                "id_professor": 1,
                "id_disciplina": 1,
                "criado_em": "2025-01-01T10:00:00",
                "atualizado_em": None
            }
        }


class TurmaResponseEnriched(TurmaBase):
    """Schema de resposta de Turma com dados enriquecidos"""
    id_turma: int
    nome_professor: Optional[str] = None
    nome_disciplina: Optional[str] = None
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_turma": 1,
                "nome": "5º A",
                "serie": "5º Ano",
                "turno": "MANHA",
                "ano_letivo": 2025,
                "id_professor": 1,
                "id_disciplina": 1,
                "nome_professor": "João Silva",
                "nome_disciplina": "Matemática",
                "criado_em": "2025-01-01T10:00:00",
                "atualizado_em": None
            }
        }


class TurmaListResponse(BaseModel):
    """Schema para listagem paginada de Turmas"""
    items: list[TurmaResponse]
    total: int
    offset: int
    limit: int


class TurmaListResponseEnriched(BaseModel):
    """Schema para listagem paginada de Turmas com dados enriquecidos"""
    items: list[TurmaResponseEnriched]
    total: int
    offset: int
    limit: int
