from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field


class Calendario(SQLModel, table=True):
    """
    Modelo de Calendário do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "calendario"
    
    id_calendario: Optional[int] = Field(default=None, primary_key=True)
    data: date = Field(nullable=False)
    evento: str = Field(nullable=False, max_length=200)
    descricao: Optional[str] = None  # TEXT no PostgreSQL
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": "2025-02-10",
                "evento": "Início das Aulas",
                "descricao": "Primeiro dia do ano letivo 2025"
            }
        }
