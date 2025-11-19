#!/bin/bash

echo "🚀 Iniciando Sistema de Gerenciamento Escolar"
echo ""

# Verifica se o ambiente virtual está ativo
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "📦 Ativando ambiente virtual..."
    source venv/bin/activate
fi

# Verifica se o PostgreSQL está rodando
echo "🔍 Verificando PostgreSQL..."

# Tenta conectar ao banco
if command -v psql &> /dev/null; then
    if psql -h localhost -U trajano_user -d CETA_TRAJANO_ALM -c "SELECT 1;" &> /dev/null; then
        echo "✅ PostgreSQL está rodando"
    else
        echo "⚠️  PostgreSQL não está acessível"
        echo ""
        echo "📝 OPÇÕES:"
        echo "1. Se você tem Docker instalado:"
        echo "   docker run --name ceta_trajano_postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=xxxxx -e POSTGRES_DB=CETA_TRAJANO_ALM -p 5432:5432 -d postgres:16-alpine"
        echo ""
        echo "2. Se você tem PostgreSQL instalado localmente:"
        echo "   createdb CETA_TRAJANO_ALM"
        echo ""
        echo "3. Para usar SQLite (sem PostgreSQL), edite o .env:"
        echo "   DATABASE_URL=sqlite+aiosqlite:///./CETA_TRAJANO_ALM.db"
        echo ""
    fi
else
    echo "⚠️  psql não está instalado. Não foi possível verificar PostgreSQL."
fi

echo ""
echo "🚀 Iniciando API FastAPI..."
echo "📍 Acesse: http://localhost:8000/docs"
echo ""

# Inicia o servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
