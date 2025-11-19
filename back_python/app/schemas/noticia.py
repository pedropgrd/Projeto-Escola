from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# NOTÍCIA SCHEMAS
# ============================================

class NoticiaBase(BaseModel):
    """Schema base para Notícia"""
    titulo: str = Field(min_length=3, max_length=200)
    conteudo: str = Field(min_length=10, description="Conteúdo da notícia")
    data: date = Field(default_factory=date.today)


class NoticiaCreate(NoticiaBase):
    """Schema para criação de Notícia - ADMIN e PROFESSOR podem criar"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Início do Ano Letivo 2025",
                "conteudo": "Informamos que as aulas terão início no dia 10 de fevereiro de 2025. Todas as famílias devem comparecer para a reunião inicial.",
                "data": "2025-01-15"
            }
        }


class NoticiaUpdate(BaseModel):
    """Schema para atualização de Notícia"""
    titulo: Optional[str] = Field(None, min_length=3, max_length=200)
    conteudo: Optional[str] = Field(None, min_length=10)
    data: Optional[date] = None


class NoticiaResponse(NoticiaBase):
    """Schema de resposta de Notícia"""
    id_noticia: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_noticia": 1,
                "titulo": "Início do Ano Letivo 2025",
                "conteudo": "Informamos que as aulas terão início no dia 10 de fevereiro de 2025...",
                "data": "2025-01-15",
                "criado_em": "2025-01-10T10:00:00",
                "atualizado_em": None
            }
        }


class NoticiaListResponse(BaseModel):
    """Schema para listagem paginada de Notícias"""
    items: list[NoticiaResponse]
    total: int
    offset: int
    limit: int
