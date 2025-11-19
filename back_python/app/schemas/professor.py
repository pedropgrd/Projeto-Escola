from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# ============================================
# PROFESSOR SCHEMAS
# ============================================

class ProfessorBase(BaseModel):
    """Schema base para Professor"""
    nome: str = Field(min_length=3, max_length=150)
    cpf: str = Field(min_length=11, max_length=11, pattern="^[0-9]{11}$", description="CPF sem formatação (apenas 11 dígitos)")
    endereco: Optional[str] = Field(None, max_length=255)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


class ProfessorCreate(ProfessorBase):
    """Schema para criação de Professor - Apenas ADMIN pode criar"""
    id_usuario: int = Field(gt=0, description="ID do usuário associado")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_usuario": 3,
                "nome": "Maria Oliveira Costa",
                "cpf": "98765432100",
                "endereco": "Av. Principal, 456",
                "telefone": "(11) 91234-5678",
                "email": "maria.oliveira@escola.com"
            }
        }


class ProfessorUpdate(BaseModel):
    """Schema para atualização de Professor"""
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    cpf: Optional[str] = Field(None, min_length=11, max_length=11, pattern="^[0-9]{11}$")
    endereco: Optional[str] = Field(None, max_length=255)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


class ProfessorResponse(ProfessorBase):
    """Schema de resposta de Professor"""
    id_professor: int
    id_usuario: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_professor": 1,
                "id_usuario": 3,
                "nome": "Maria Oliveira Costa",
                "cpf": "98765432100",
                "endereco": "Av. Principal, 456",
                "telefone": "(11) 91234-5678",
                "email": "maria.oliveira@escola.com",
                "criado_em": "2025-01-05T10:00:00",
                "atualizado_em": None
            }
        }


class ProfessorListResponse(BaseModel):
    """Schema para listagem paginada de Professores"""
    items: list[ProfessorResponse]
    total: int
    offset: int
    limit: int
