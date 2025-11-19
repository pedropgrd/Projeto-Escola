from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# GALERIA SCHEMAS
# ============================================

class GaleriaBase(BaseModel):
    """Schema base para Galeria"""
    id_evento: Optional[int] = Field(None, gt=0, description="ID do evento relacionado")
    descricao: Optional[str] = Field(None, max_length=255)
    data: date = Field(default_factory=date.today)


class GaleriaCreate(GaleriaBase):
    """Schema para criação de Galeria - ADMIN e PROFESSOR podem criar"""
    imagem_base64: Optional[str] = Field(None, description="Imagem em formato Base64")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_evento": 1,
                "descricao": "Foto da festa junina",
                "data": "2025-06-15",
                "imagem_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
            }
        }


class GaleriaUpdate(BaseModel):
    """Schema para atualização de Galeria"""
    id_evento: Optional[int] = Field(None, gt=0)
    descricao: Optional[str] = Field(None, max_length=255)
    data: Optional[date] = None
    imagem_base64: Optional[str] = Field(None, description="Nova imagem em formato Base64")


class GaleriaResponse(GaleriaBase):
    """Schema de resposta de Galeria (sem dados binários)"""
    id_imagem: int
    has_image: bool = Field(description="Indica se a imagem existe")
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_imagem": 1,
                "id_evento": 1,
                "descricao": "Foto da festa junina",
                "data": "2025-06-15",
                "has_image": True,
                "criado_em": "2025-06-15T18:00:00",
                "atualizado_em": None
            }
        }


class GaleriaImageResponse(BaseModel):
    """Schema para retornar imagem em Base64"""
    id_imagem: int
    imagem_base64: str
    descricao: Optional[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_imagem": 1,
                "imagem_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
                "descricao": "Foto da festa junina"
            }
        }


class GaleriaListResponse(BaseModel):
    """Schema para listagem paginada de Galeria"""
    items: list[GaleriaResponse]
    total: int
    offset: int
    limit: int
