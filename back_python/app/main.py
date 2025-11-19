from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.init_db import create_db_and_tables
from app.routers import auth, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação
    - Startup: Cria as tabelas no banco
    - Shutdown: Cleanup (se necessário)
    """
    # Startup
    print("🚀 Iniciando aplicação...")
    await create_db_and_tables()
    print("✅ Banco de dados inicializado")
    
    yield
    
    # Shutdown
    print("👋 Encerrando aplicação...")


# Inicializa o FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API REST para gerenciamento escolar com autenticação JWT",
    version="1.0.0",
    lifespan=lifespan
)


# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Lista de origens permitidas
    allow_credentials=True,  # Permite cookies
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, etc)
    allow_headers=["*"],  # Permite todos os headers
)


# Registra os routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """
    ## Endpoint raiz
    
    Retorna informações básicas da API.
    """
    return {
        "message": "Sistema de Gerenciamento Escolar - API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    ## Health Check
    
    Verifica se a API está respondendo.
    """
    return {"status": "healthy"}
