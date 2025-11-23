from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# DISCIPLINA SCHEMAS
# ============================================

class DisciplinaBase(BaseModel):
    """Schema base para Disciplina"""
    nome: str = Field(min_length=3, max_length=100)


class DisciplinaCreate(DisciplinaBase):
    """Schema para criação de Disciplina - Apenas ADMIN pode criar"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Matemática"
            }
        }


class DisciplinaUpdate(BaseModel):
    """Schema para atualização de Disciplina"""
    nome: Optional[str] = Field(None, min_length=3, max_length=100)


class DisciplinaResponse(DisciplinaBase):
    """Schema de resposta de Disciplina"""
    id_disciplina: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_disciplina": 1,
                "nome": "Matemática",
                "criado_em": "2025-01-01T10:00:00",
                "atualizado_em": None
            }
        }


class DisciplinaListResponse(BaseModel):
    """Schema para listagem paginada de Disciplinas"""
    items: list[DisciplinaResponse]
    total: int
    offset: int
    limit: int
