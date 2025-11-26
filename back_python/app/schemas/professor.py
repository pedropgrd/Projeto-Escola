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
    """Schema para criação de Professor - Apenas ADMIN pode criar
    
    Agora cria apenas o registro do professor, sem vincular usuário automaticamente.
    Para vincular um usuário posteriormente, use o endpoint de vinculação.
    """
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Maria Oliveira Costa",
                "cpf": "98765432100",
                "endereco": "Av. Principal, 456",
                "telefone": "11912345678",
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
    """Schema de resposta de Professor
    
    Inclui dados do professor e email do usuário vinculado (se houver).
    """
    id_professor: int
    id_usuario: Optional[int] = None
    email_usuario: Optional[str] = None
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_professor": 1,
                "id_usuario": 3,
                "email_usuario": "maria.oliveira@login.escola.com",
                "nome": "Maria Oliveira Costa",
                "cpf": "98765432100",
                "endereco": "Av. Principal, 456",
                "telefone": "11912345678",
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


# ============================================
# SCHEMAS PARA VINCULAÇÃO DE USUÁRIO
# ============================================

class VincularUsuarioCreate(BaseModel):
    """Schema para criar e vincular um usuário a um professor existente"""
    cpf: str = Field(description="CPF do professor")
    email: str = Field(description="Email para login do professor")
    senha: str = Field(min_length=6, max_length=72, description="Senha para login")
    
    class Config:
        json_schema_extra = {
            "example": {
                "cpf": "98765432100",
                "email": "maria.oliveira@login.escola.com",
                "senha": "senha123"
            }
        }


class VincularUsuarioExistente(BaseModel):
    """Schema para vincular um usuário já existente a um professor"""
    id_usuario: int = Field(gt=0, description="ID do usuário a ser vinculado")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_usuario": 15
            }
        }
