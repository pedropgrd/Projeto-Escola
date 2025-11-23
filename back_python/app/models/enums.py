from enum import Enum


class TurnoEnum(str, Enum):
    """
    Enum para turnos escolares
    """
    MANHA = "MANHA"
    TARDE = "TARDE"
    NOITE = "NOITE"
