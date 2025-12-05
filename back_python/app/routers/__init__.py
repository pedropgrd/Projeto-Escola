"""
Routers do sistema escolar
"""

from app.routers import auth, users, alunos, professores, servidores, noticias, galeria, turmas

__all__ = [
    "auth",
    "users",
    "alunos",
    "professores",
    "servidores",
    "noticias",
    "galeria",
    "turmas",
]
