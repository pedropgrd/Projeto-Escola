"""
Script para criar o primeiro usuário ADMIN no sistema.

Execute este script apenas UMA VEZ para criar o usuário administrador inicial.

Uso:
    python create_admin.py
"""

import asyncio
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent))

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database.session import async_session
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_admin():
    """Cria o primeiro usuário ADMIN"""
    
    print("🔐 Criando usuário ADMIN inicial...")
    print()
    
    # Dados do admin
    email = input("E-mail do admin [admin.wag@escola.com]: ").strip() or "admin.wag@escola.com"
    nome_completo = input("Nome completo [Administrador do Sistema]: ").strip() or "Administrador do Sistema"
    senha = input("Senha (mínimo 6 caracteres): ").strip()
    
    # Validações
    if len(senha) < 6:
        print("❌ Erro: Senha deve ter no mínimo 6 caracteres")
        return
    
    if len(senha) > 72:
        print("⚠️  Aviso: Senha será truncada para 72 caracteres (limite do bcrypt)")
        senha = senha[:72]
    
    # Conecta ao banco
    async with async_session() as session:
        # Verifica se já existe um admin com este e-mail
        statement = select(User).where(User.email == email)
        result = await session.execute(statement)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"❌ Erro: Já existe um usuário com o e-mail {email}")
            return
        
        # Cria o usuário admin
        admin = User(
            email=email,
            nome_completo=nome_completo,
            senha_hash=get_password_hash(senha),
            perfil=UserRole.ADMIN,
            ativo=True
        )
        
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        
        print()
        print("✅ Usuário ADMIN criado com sucesso!")
        print()
        print(f"📧 E-mail: {admin.email}")
        print(f"👤 Nome: {admin.nome_completo}")
        print(f"🔑 Perfil: {admin.perfil}")
        print(f"🆔 ID: {admin.id}")
        print()
        print("🚀 Agora você pode fazer login usando estas credenciais!")


if __name__ == "__main__":
    try:
        asyncio.run(create_admin())
    except KeyboardInterrupt:
        print("\n\n⚠️  Operação cancelada pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
