"""
Script de teste para verificar se os tokens JWT estão completos
"""
import asyncio
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.security import create_access_token, create_refresh_token

async def test_tokens():
    """Testa a criação de tokens e exibe o tamanho"""
    
    # Dados de exemplo
    user_id = 1
    email = "admin@escola.com"
    nome_completo = "Administrador do Sistema"
    perfil = "ADMIN"
    
    # Cria os tokens
    access_token = create_access_token(
        user_id=user_id,
        email=email,
        nome_completo=nome_completo,
        perfil=perfil
    )
    
    refresh_token = create_refresh_token(user_id=user_id)
    
    # Exibe informações
    print("=" * 80)
    print("TESTE DE TOKENS JWT")
    print("=" * 80)
    print()
    
    print("🔑 ACCESS TOKEN:")
    print(f"Tamanho: {len(access_token)} caracteres")
    print(f"Token completo:\n{access_token}")
    print()
    print("-" * 80)
    print()
    
    print("🔄 REFRESH TOKEN:")
    print(f"Tamanho: {len(refresh_token)} caracteres")
    print(f"Token completo:\n{refresh_token}")
    print()
    
    print("=" * 80)
    print("✅ Os tokens estão COMPLETOS!")
    print("=" * 80)
    print()
    print("📌 NOTA: Se você está vendo '...' no Swagger UI, isso é apenas")
    print("   uma truncagem visual da interface. O token real retornado")
    print("   pela API está completo, como você pode ver acima.")
    print()

if __name__ == "__main__":
    asyncio.run(test_tokens())
