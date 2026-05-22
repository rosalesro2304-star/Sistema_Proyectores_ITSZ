from sqlalchemy import Column, Integer, String, Boolean, Date, Time, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    rol = Column(String(20), nullable=False) # 'Vigilante' o 'Directivo'

class Docente(Base):
    __tablename__ = "docentes"
    
    id_docente = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)

class Proyector(Base):
    __tablename__ = "proyectores"
    
    id_proyector = Column(String(20), primary_key=True, index=True) # Ej. 'V-4'
    descripcion = Column(String(150), nullable=False)
    estado = Column(String(30), default="Disponible", nullable=False)

class Prestamo(Base):
    __tablename__ = "prestamos"
    
    id_prestamo = Column(Integer, primary_key=True, index=True)
    id_docente = Column(Integer, ForeignKey("docentes.id_docente"), nullable=False)
    id_proyector = Column(String(20), ForeignKey("proyectores.id_proyector"), nullable=False)
    fecha_prestamo = Column(Date, default=date.today, nullable=False)
    hora_salida = Column(Time, nullable=False)
    hora_entrega = Column(Time, nullable=True) # Nulo hasta que lo devuelvan
    incluye_cable = Column(Boolean, default=False, nullable=False)
    observaciones = Column(Text, nullable=True)
    estado_prestamo = Column(String(20), default="En Uso", nullable=False)
    firma_salida = Column(Text, nullable=False) # Aquí guardaremos el lienzo Canvas Base64
    firma_entrega = Column(Text, nullable=True)
    registrado_por = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    # Relaciones para poder hacer consultas avanzadas fácilmente
    docente = relationship("Docente")
    proyector = relationship("Proyector")
    usuario = relationship("Usuario")