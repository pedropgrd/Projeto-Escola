"""
Script para criar todas as tabelas do banco de dados

Execute este script para criar todas as tabelas definidas nos modelos SQLModel.

IMPORTANTE: Este script cria as tabelas diretamente. Em produção, use Alembic para migrações.
"""

from sqlmodel import SQLModel
from app.database.session import engine
from app.models import (
    User, UserRole,
    Aluno, Professor, Disciplina, Turma, AlunoTurma,
    Noticia, Evento, Galeria, Calendario
)


async def create_tables():
    """Criar todas as tabelas no banco de dados"""
    async with engine.begin() as conn:
        # Drop all tables (CUIDADO: apenas para desenvolvimento!)
        # await conn.run_sync(SQLModel.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(SQLModel.metadata.create_all)
    
    print("✅ Todas as tabelas foram criadas com sucesso!")
    print("\nTabelas criadas:")
    print("  - usuarios")
    print("  - aluno")
    print("  - professor")
    print("  - disciplina")
    print("  - turma")
    print("  - aluno_turma")
    print("  - noticias")
    print("  - eventos")
    print("  - galeria")
    print("  - calendario")


if __name__ == "__main__":
    import asyncio
    asyncio.run(create_tables())
