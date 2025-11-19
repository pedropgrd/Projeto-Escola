from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Evento(SQLModel, table=True):
    """
    Modelo de Evento do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "eventos"
    
    id_evento: Optional[int] = Field(default=None, primary_key=True)
    titulo: str = Field(nullable=False, max_length=200)
    conteudo: Optional[str] = None  # TEXT no PostgreSQL
    data: Optional[date] = None
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    imagens: List["Galeria"] = Relationship(back_populates="evento")
    
    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Festa Junina 2025",
                "conteudo": "Grande festa junina com apresentações dos alunos...",
                "data": "2025-06-15"
            }
        }
