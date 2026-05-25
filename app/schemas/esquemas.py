from pydantic import BaseModel, Field
from datetime import date, time

# --- ESQUEMAS DE USUARIOS ---
class UsuarioBase(BaseModel):
    username: str
    rol: str

class UsuarioCrear(UsuarioBase):
    password: str = Field(..., max_length=50)

class UsuarioRespuesta(UsuarioBase):
    id_usuario: int

    class Config:
        from_attributes = True

# --- ESQUEMAS DE DOCENTES ---
class DocenteRespuesta(BaseModel):
    id_docente: int
    nombre_completo: str

    class Config:
        from_attributes = True

# --- ESQUEMAS DE PROYECTORES ---
class ProyectorRespuesta(BaseModel):
    id_proyector: str
    descripcion: str
    estado: str

    class Config:
        from_attributes = True

# --- ESQUEMAS DE PRÉSTAMOS ---
class PrestamoCrear(BaseModel):
    id_docente: int
    id_proyector: str
    incluye_cable: bool
    observaciones: str | None = None
    firma_salida: str  # Aquí recibiremos el string gigante del Canvas (Base64)
    registrado_por: int

# --- ESQUEMA PARA EDITAR PRÉSTAMO (NUEVO) ---
class PrestamoEditar(BaseModel):
    incluye_cable: bool
    observaciones: str | None = None

# --- ESQUEMA PARA LA DEVOLUCIÓN ---
class PrestamoDevolucion(BaseModel):
    firma_entrega: str  # El Base64 de la firma de recibido
    observaciones: str | None = None  # Por si el cañón regresa con alguna falla nueva

# --- ESQUEMA PARA LOGIN ---
class UsuarioLogin(BaseModel):
    username: str
    password: str

# --- ESQUEMA PARA VER PRÉSTAMOS ACTIVOS ---
class PrestamoActivoRespuesta(BaseModel):
    id_prestamo: int
    fecha_prestamo: date
    hora_salida: time
    estado_prestamo: str
    observaciones: str | None = None
    
    # ¡NUEVO: Variables expuestas para el frontend!
    incluye_cable: bool
    firma_salida: str | None
    
    # Anidamos las respuestas que ya tenías
    docente: DocenteRespuesta
    proyector: ProyectorRespuesta

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA REPORTES (DASHBOARD) ---
class ReporteDocente(BaseModel):
    nombre_completo: str
    total_prestamos: int

    class Config:
        from_attributes = True

class ReporteProyector(BaseModel):
    id_proyector: str
    descripcion: str
    total_usos: int

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA CREAR CATÁLOGOS ---
class DocenteCrear(BaseModel):
    nombre_completo: str

class ProyectorCrear(BaseModel):
    id_proyector: str
    descripcion: str

   # --- ESQUEMA PARA EL HISTORIAL DE LA CASETA ---
class PrestamoHistorialRespuesta(BaseModel):
    id_prestamo: int
    fecha_prestamo: date
    hora_salida: time
    hora_entrega: time | None = None
    estado_prestamo: str
    
    # --- Variables agregadas para el historial ---
    incluye_cable: bool  
    observaciones: str | None = None
    firma_salida: str | None = None
    firma_entrega: str | None = None
    # ---------------------------------------------
    
    docente: DocenteRespuesta
    proyector: ProyectorRespuesta

    class Config:
        from_attributes = True