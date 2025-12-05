from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# ============================================
# SERVIDOR SCHEMAS
# ============================================

class ServidorBase(BaseModel):
    """Schema base para Servidor"""
    nome: str = Field(min_length=3, max_length=150)
    cpf: str = Field(min_length=11, max_length=11, description="CPF sem formatação (apenas 11 dígitos)")
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = Field(None, max_length=255)
    funcao: Optional[str] = Field(None, max_length=100, description="Função do servidor (ex: Secretária, Inspetor, etc.)")


class ServidorCreate(ServidorBase):
    """Schema para criação de Servidor - Apenas ADMIN pode criar
    
    Cria apenas o registro do servidor, sem vincular usuário automaticamente.
    Para vincular um usuário posteriormente, use o endpoint de vinculação.
    """
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Ana Paula Souza",
                "cpf": "11122233344",
                "email": "ana.souza@escola.com",
                "telefone": "11987654321",
                "endereco": "Rua das Acácias, 789",
                "funcao": "Secretária"
            }
        }


class ServidorUpdate(BaseModel):
    """Schema para atualização de Servidor"""
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    cpf: Optional[str] = Field(None, min_length=11, max_length=11)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = Field(None, max_length=255)
    funcao: Optional[str] = Field(None, max_length=100, description="Função do servidor")


class ServidorResponse(ServidorBase):
    """Schema de resposta de Servidor
    
    Inclui dados do servidor e email do usuário vinculado (se houver).
    """
    id_servidor: int
    id_usuario: Optional[int] = None
    email_usuario: Optional[str] = None
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_servidor": 1,
                "id_usuario": 10,
                "email_usuario": "ana.souza@login.escola.com",
                "nome": "Ana Paula Souza",
                "cpf": "11122233344",
                "email": "ana.souza@escola.com",
                "telefone": "11987654321",
                "endereco": "Rua das Acácias, 789",
                "funcao": "Secretária",
                "criado_em": "2025-11-26T10:00:00",
                "atualizado_em": None
            }
        }


class ServidorListResponse(BaseModel):
    """Schema para listagem paginada de Servidores"""
    items: list[ServidorResponse]
    total: int
    offset: int
    limit: int


# ============================================
# SCHEMAS PARA VINCULAÇÃO DE USUÁRIO
# ============================================

class VincularUsuarioCreate(BaseModel):
    """Schema para criar e vincular um usuário a um servidor existente"""
    cpf: str = Field(description="CPF do servidor")
    email: str = Field(description="Email para login do servidor")
    senha: str = Field(min_length=6, max_length=72, description="Senha para login")
    
    class Config:
        json_schema_extra = {
            "example": {
                "cpf": "11122233344",
                "email": "ana.souza@login.escola.com",
                "senha": "senha123"
            }
        }


class VincularUsuarioExistente(BaseModel):
    """Schema para vincular um usuário existente a um servidor"""
    cpf: str = Field(description="CPF do servidor")
    usuario_id: int = Field(description="ID do usuário existente")
    
    class Config:
        json_schema_extra = {
            "example": {
                "cpf": "11122233344",
                "usuario_id": 10
            }
        }
