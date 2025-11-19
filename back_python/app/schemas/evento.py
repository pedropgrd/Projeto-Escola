from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# EVENTO SCHEMAS
# ============================================

class EventoBase(BaseModel):
    """Schema base para Evento"""
    titulo: str = Field(min_length=3, max_length=200)
    conteudo: Optional[str] = None
    data: Optional[date] = None


class EventoCreate(EventoBase):
    """Schema para criação de Evento - ADMIN e PROFESSOR podem criar"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Festa Junina 2025",
                "conteudo": "Grande festa junina com apresentações dos alunos, comidas típicas e muita diversão!",
                "data": "2025-06-15"
            }
        }


class EventoUpdate(BaseModel):
    """Schema para atualização de Evento"""
    titulo: Optional[str] = Field(None, min_length=3, max_length=200)
    conteudo: Optional[str] = None
    data: Optional[date] = None


class EventoResponse(EventoBase):
    """Schema de resposta de Evento"""
    id_evento: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_evento": 1,
                "titulo": "Festa Junina 2025",
                "conteudo": "Grande festa junina com apresentações dos alunos...",
                "data": "2025-06-15",
                "criado_em": "2025-05-01T10:00:00",
                "atualizado_em": None
            }
        }


class EventoListResponse(BaseModel):
    """Schema para listagem paginada de Eventos"""
    items: list[EventoResponse]
    total: int
    offset: int
    limit: int
