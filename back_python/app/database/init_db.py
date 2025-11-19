from sqlmodel import SQLModel
from app.database.session import engine
from app.models.user import User  # noqa: F401


async def create_db_and_tables():
    """
    Cria todas as tabelas no banco de dados
    
    Importante: Importar todos os models antes de chamar esta função
    """
    async with engine.begin() as conn:
        # Cria todas as tabelas definidas com SQLModel
        await conn.run_sync(SQLModel.metadata.create_all)
