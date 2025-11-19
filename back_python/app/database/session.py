from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


# Engine assíncrono do banco de dados
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log de SQL queries em modo debug
    future=True
)

# Session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_session() -> AsyncSession:
    """
    Dependência que fornece uma sessão do banco de dados
    
    Yields:
        AsyncSession: Sessão assíncrona do SQLModel
    """
    async with async_session() as session:
        yield session
