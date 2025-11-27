from app.models.user import User, UserRole
from app.models.aluno import Aluno
from app.models.professor import Professor
from app.models.servidor import Servidor
from app.models.disciplina import Disciplina
from app.models.turma import Turma
from app.models.aluno_turma import AlunoTurma
from app.models.noticia import Noticia
from app.models.evento import Evento
from app.models.galeria import Galeria
from app.models.calendario import Calendario

__all__ = [
    "User",
    "UserRole",
    "Aluno",
    "Professor",
    "Servidor",
    "Disciplina",
    "Turma",
    "AlunoTurma",
    "Noticia",
    "Evento",
    "Galeria",
    "Calendario",
]
