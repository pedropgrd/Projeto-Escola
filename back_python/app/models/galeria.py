from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Galeria(SQLModel, table=True):
    """
    Modelo de Galeria (imagens) do sistema
    Implementa soft delete através do campo is_deleted
    """
    __tablename__ = "galeria"
    
    id_imagem: Optional[int] = Field(default=None, primary_key=True)
    id_evento: Optional[int] = Field(foreign_key="eventos.id_evento", nullable=True)
    imagem: Optional[bytes] = None  # BYTEA no PostgreSQL
    descricao: Optional[str] = Field(default=None, max_length=255)
    data: date = Field(default_factory=date.today)
    
    # Soft delete
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: Optional[datetime] = None
    
    # Relacionamentos
    evento: Optional["Evento"] = Relationship(back_populates="imagens")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_evento": 1,
                "descricao": "Foto da festa junina",
                "data": "2025-06-15"
            }
        }
