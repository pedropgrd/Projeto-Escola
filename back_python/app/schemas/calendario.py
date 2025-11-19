from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# CALENDÁRIO SCHEMAS
# ============================================

class CalendarioBase(BaseModel):
    """Schema base para Calendário"""
    data: date = Field(description="Data do evento")
    evento: str = Field(min_length=3, max_length=200, description="Nome do evento")
    descricao: Optional[str] = Field(None, description="Descrição detalhada")


class CalendarioCreate(CalendarioBase):
    """Schema para criação de Calendário - ADMIN e PROFESSOR podem criar"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": "2025-02-10",
                "evento": "Início das Aulas",
                "descricao": "Primeiro dia do ano letivo 2025"
            }
        }


class CalendarioUpdate(BaseModel):
    """Schema para atualização de Calendário"""
    data: Optional[date] = None
    evento: Optional[str] = Field(None, min_length=3, max_length=200)
    descricao: Optional[str] = None


class CalendarioResponse(CalendarioBase):
    """Schema de resposta de Calendário"""
    id_calendario: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_calendario": 1,
                "data": "2025-02-10",
                "evento": "Início das Aulas",
                "descricao": "Primeiro dia do ano letivo 2025",
                "criado_em": "2025-01-10T10:00:00",
                "atualizado_em": None
            }
        }


class CalendarioListResponse(BaseModel):
    """Schema para listagem paginada de Calendário"""
    items: list[CalendarioResponse]
    total: int
    offset: int
    limit: int
