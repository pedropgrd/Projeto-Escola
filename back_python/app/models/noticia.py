from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field


class Noticia(SQLModel, table=True):
    """
    Modelo de Notícia do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "noticias"
    
    id_noticia: Optional[int] = Field(default=None, primary_key=True)
    titulo: str = Field(nullable=False, max_length=200)
    conteudo: str = Field(nullable=False)  # TEXT no PostgreSQL
    data: date = Field(default_factory=date.today)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Início do Ano Letivo 2025",
                "conteudo": "Informamos que as aulas terão início no dia 10 de fevereiro de 2025...",
                "data": "2025-01-15"
            }
        }
