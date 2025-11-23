from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# ALUNO SCHEMAS
# ============================================

class AlunoBase(BaseModel):
    """Schema base para Aluno"""
    matricula: str = Field(min_length=1, max_length=20)
    nome: str = Field(min_length=3, max_length=150)
    cpf: str = Field(min_length=11, max_length=11, pattern="^[0-9]{11}$", description="CPF sem formatação (apenas 11 dígitos)")
    data_nascimento: Optional[date] = None
    endereco: Optional[str] = Field(None, max_length=255)
    telefone: Optional[str] = Field(None, max_length=20)
    nome_responsavel: str = Field(min_length=3, max_length=150)


class AlunoCreate(AlunoBase):
    """Schema para criação de Aluno - Apenas ADMIN pode criar
    
    Agora cria apenas o registro do aluno, sem vincular usuário automaticamente.
    Para vincular um usuário posteriormente, use o endpoint de vinculação.
    """
    
    class Config:
        json_schema_extra = {
            "example": {
                "cpf": "12345678900",
                "data_nascimento": "2010-05-15",
                "endereco": "Rua das Flores, 123",
                "matricula": "2025001",
                "nome": "João Pedro Santos",
                "telefone": "11987654321",
                "nome_responsavel": "Maria Santos"
            }
        }


class AlunoUpdate(BaseModel):
    """Schema para atualização de Aluno"""
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    cpf: Optional[str] = Field(None, min_length=11, max_length=11, pattern="^[0-9]{11}$")
    data_nascimento: Optional[date] = None
    endereco: Optional[str] = Field(None, max_length=255)
    telefone: Optional[str] = Field(None, max_length=20)
    nome_responsavel: Optional[str] = Field(None, min_length=3, max_length=150)


class AlunoResponse(AlunoBase):
    """Schema de resposta de Aluno
    
    Inclui dados do aluno e email do usuário vinculado (se houver).
    """
    id_aluno: int
    id_usuario: Optional[int] = None
    email_usuario: Optional[str] = None
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_aluno": 1,
                "id_usuario": 5,
                "email_usuario": "aluno@escola.com",
                "matricula": "2025001",
                "nome": "João Silva Santos",
                "cpf": "12345678900",
                "data_nascimento": "2010-05-15",
                "endereco": "Rua das Flores, 123",
                "telefone": "(11) 98765-4321",
                "nome_responsavel": "Maria Silva Santos",
                "criado_em": "2025-01-10T10:00:00",
                "atualizado_em": None
            }
        }


class AlunoListResponse(BaseModel):
    """Schema para listagem paginada de Alunos"""
    items: list[AlunoResponse]
    total: int
    offset: int
    limit: int


# ============================================
# SCHEMAS PARA VINCULAÇÃO DE USUÁRIO
# ============================================

class VincularUsuarioCreate(BaseModel):
    """Schema para criar e vincular um usuário a um aluno existente"""
    email: str = Field(description="Email para login do aluno")
    senha: str = Field(min_length=6, max_length=72, description="Senha para login")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "joao.santos@escola.com",
                "senha": "senha123"
            }
        }


class VincularUsuarioExistente(BaseModel):
    """Schema para vincular um usuário já existente a um aluno"""
    id_usuario: int = Field(gt=0, description="ID do usuário a ser vinculado")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id_usuario": 15
            }
        }
