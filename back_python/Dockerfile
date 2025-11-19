# Multi-stage build para produção
FROM python:3.11-slim as builder

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


# Stage final
FROM python:3.11-slim

WORKDIR /app

# Copia dependências do builder
COPY --from=builder /root/.local /root/.local

# Garante que scripts Python estão no PATH
ENV PATH=/root/.local/bin:$PATH

# Copia o código da aplicação
COPY . .

# Expõe a porta da API
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
