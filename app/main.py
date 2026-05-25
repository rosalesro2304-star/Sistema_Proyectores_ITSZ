from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, func

from app.database import engine, Base, get_db
from app.models import modelos
from app.schemas import esquemas
from zoneinfo import ZoneInfo

# Configuración de seguridad para contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generación automática de tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Control de Proyectores ITSZ",
    description="Backend oficial para la caseta de vigilancia",
    version="1.0.0"
)


origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://sistema-proyectores-itsz.vercel.app", 
    "https://sistema-proyectores-itsz-b35dnrpx7-rosalesro2304-stars-projects.vercel.app" 
]

# Configuración estricta de CORS para producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],

)

# ==========================================
# 1. MÓDULO DE SEGURIDAD Y USUARIOS
# ==========================================

@app.post("/api/usuarios", response_model=esquemas.UsuarioRespuesta)
def registrar_usuario(usuario: esquemas.UsuarioCrear, db: Session = Depends(get_db)):

    hashed_password = pwd_context.hash(usuario.password[:72])
    
    nuevo_usuario = modelos.Usuario(
        username=usuario.username,
        password_hash=hashed_password,
        rol=usuario.rol
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@app.post("/api/login")
def login(credenciales: esquemas.UsuarioLogin, db: Session = Depends(get_db)):

    usuario_db = db.query(modelos.Usuario).filter(modelos.Usuario.username == credenciales.username).first()
    

    if not usuario_db or not pwd_context.verify(credenciales.password, usuario_db.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    

    return {
        "mensaje": "Login exitoso",
        "id_usuario": usuario_db.id_usuario,
        "username": usuario_db.username,
        "rol": usuario_db.rol
    }


# ==========================================
# 2. MÓDULO DE CATÁLOGOS (PANTALLA CASETA)
# ==========================================

@app.get("/api/docentes", response_model=list[esquemas.DocenteRespuesta])
def obtener_docentes(db: Session = Depends(get_db)):
    """Retorna la lista completa de docentes ACTIVOS para el buscador de la caseta"""
    docentes = db.query(modelos.Docente).filter(modelos.Docente.activo == True).all()
    return docentes

@app.get("/api/proyectores/disponibles", response_model=list[esquemas.ProyectorRespuesta])
def obtener_proyectores_disponibles(db: Session = Depends(get_db)):
    """Filtra y retorna solo los cañones que están listos y ACTIVOS en el almacén"""
    proyectores = db.query(modelos.Proyector).filter(
        modelos.Proyector.estado == "Disponible",
        modelos.Proyector.activo == True
    ).all()
    return proyectores

# ==========================================
# 3. MÓDULO DE PRÉSTAMOS (NÚCLEO)
# ==========================================

@app.post("/api/prestamos")

def registrar_prestamo(prestamo: esquemas.PrestamoCrear, db: Session = Depends(get_db)):

    nuevo_prestamo = modelos.Prestamo(
        id_docente=prestamo.id_docente,
        id_proyector=prestamo.id_proyector,
        fecha_prestamo=datetime.now(ZoneInfo("America/Mexico_City")).date(),
        hora_salida=datetime.now(ZoneInfo("America/Mexico_City")).time(),
        incluye_cable=prestamo.incluye_cable,
        observaciones=prestamo.observaciones,
        firma_salida=prestamo.firma_salida,
        registrado_por=prestamo.registrado_por
    )
    db.add(nuevo_prestamo)


    proyector_db = db.query(modelos.Proyector).filter(modelos.Proyector.id_proyector == prestamo.id_proyector).first()
    if proyector_db:
        proyector_db.estado = "En Uso"


    db.commit()

    return {"mensaje": "Préstamo registrado con éxito y proyector marcado en uso"}


@app.get("/api/prestamos/activos", response_model=list[esquemas.PrestamoActivoRespuesta])
def obtener_prestamos_activos(db: Session = Depends(get_db)):

    prestamos_activos = db.query(modelos.Prestamo).filter(modelos.Prestamo.estado_prestamo == "En Uso").all()

    return prestamos_activos

@app.get("/api/prestamos/historial", response_model=list[esquemas.PrestamoHistorialRespuesta])
def obtener_historial_prestamos(db: Session = Depends(get_db)):

    historial = db.query(modelos.Prestamo).all()
    return historial

# ==========================================
# 4. COMPLETANDO EL CRUD (ACTUALIZAR Y ELIMINAR)
# ==========================================

@app.put("/api/prestamos/{id_prestamo}")
def editar_prestamo(id_prestamo: int, payload: esquemas.PrestamoEditar, db: Session = Depends(get_db)):
   
    prestamo_db = db.query(modelos.Prestamo).filter(modelos.Prestamo.id_prestamo == id_prestamo).first()
   
    if not prestamo_db:
        raise HTTPException(status_code=404, detail="El préstamo no existe")
    
   
    prestamo_db.incluye_cable = payload.incluye_cable
    prestamo_db.observaciones = payload.observaciones
    
    db.commit()
   
    db.refresh(prestamo_db)
   
    return {"mensaje": "Registro editado correctamente"}

@app.put("/api/prestamos/{id_prestamo}/devolucion")
def devolver_proyector(id_prestamo: int, datos: esquemas.PrestamoDevolucion, db: Session = Depends(get_db)):

    prestamo_db = db.query(modelos.Prestamo).filter(modelos.Prestamo.id_prestamo == id_prestamo).first()
    if not prestamo_db:
        raise HTTPException(status_code=404, detail="El registro de préstamo no existe.")

    if prestamo_db.estado_prestamo == "Devuelto":
        raise HTTPException(status_code=400, detail="Este préstamo ya había sido devuelto anteriormente.")


    prestamo_db.hora_entrega = datetime.now(ZoneInfo("America/Mexico_City")).time()
    prestamo_db.firma_entrega = datos.firma_entrega
    prestamo_db.estado_prestamo = "Devuelto"
    

    if datos.observaciones:

        prestamo_db.observaciones = f"{prestamo_db.observaciones} | Devuelto con: {datos.observaciones}"


    proyector_db = db.query(modelos.Proyector).filter(modelos.Proyector.id_proyector == prestamo_db.id_proyector).first()
    if proyector_db:
        proyector_db.estado = "Disponible"

    db.commit()
    return {"mensaje": f"Proyector {prestamo_db.id_proyector} liberado con éxito."}

@app.delete("/api/prestamos/{id_prestamo}")
def eliminar_prestamo(id_prestamo: int, db: Session = Depends(get_db)):

    prestamo_db = db.query(modelos.Prestamo).filter(modelos.Prestamo.id_prestamo == id_prestamo).first()
    if not prestamo_db:
        raise HTTPException(status_code=404, detail="El registro que deseas eliminar no existe.")
    

    if prestamo_db.estado_prestamo == "En Uso":
        proyector_db = db.query(modelos.Proyector).filter(modelos.Proyector.id_proyector == prestamo_db.id_proyector).first()
        if proyector_db:
            proyector_db.estado = "Disponible"


    db.delete(prestamo_db)
    db.commit()


    return {"mensaje": f"El registro de préstamo con ID {id_prestamo} ha sido eliminado permanentemente."}

# ==========================================
# 5. MÓDULO DE REPORTES (PANEL DIRECTIVO)
# ==========================================

@app.get("/api/reportes/ranking-docentes", response_model=list[esquemas.ReporteDocente])
def obtener_ranking_docentes(db: Session = Depends(get_db)):

    ranking = db.query(
        modelos.Docente.nombre_completo,
        func.count(modelos.Prestamo.id_prestamo).label("total_prestamos")
    ).join(modelos.Prestamo, modelos.Docente.id_docente == modelos.Prestamo.id_docente)\
     .group_by(modelos.Docente.nombre_completo)\
     .order_by(func.count(modelos.Prestamo.id_prestamo).desc())\
     .all()

    return ranking


@app.get("/api/reportes/uso-proyectores", response_model=list[esquemas.ReporteProyector])
def obtener_uso_proyectores(db: Session = Depends(get_db)):

    uso = db.query(
        modelos.Proyector.id_proyector,
        modelos.Proyector.descripcion,
        func.count(modelos.Prestamo.id_prestamo).label("total_usos")
    ).join(modelos.Prestamo, modelos.Proyector.id_proyector == modelos.Prestamo.id_proyector)\
     .group_by(modelos.Proyector.id_proyector, modelos.Proyector.descripcion)\
     .order_by(func.count(modelos.Prestamo.id_prestamo).desc())\
     .all()


    return uso

# ==========================================
# 6. GESTIÓN DE CATÁLOGOS (CRUD COMPLETO)
# ==========================================

# --- GESTIÓN DE DOCENTES ---
@app.post("/api/docentes", response_model=esquemas.DocenteRespuesta)
def crear_docente(docente: esquemas.DocenteCrear, db: Session = Depends(get_db)):

    nuevo_docente = modelos.Docente(nombre_completo=docente.nombre_completo)
    db.add(nuevo_docente)
    db.commit()
    db.refresh(nuevo_docente)
    return nuevo_docente

@app.delete("/api/docentes/{id_docente}")
def eliminar_docente(id_docente: int, db: Session = Depends(get_db)):
    """Da de baja a un maestro (Borrado Lógico)"""
    docente_db = db.query(modelos.Docente).filter(modelos.Docente.id_docente == id_docente).first()
    if not docente_db:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    
    docente_db.activo = False # Se apaga en lugar de borrar
    db.commit()
    return {"mensaje": "Docente dado de baja correctamente (Historial conservado)"}


# --- GESTIÓN DE PROYECTORES ---
@app.post("/api/proyectores", response_model=esquemas.ProyectorRespuesta)
def crear_proyector(proyector: esquemas.ProyectorCrear, db: Session = Depends(get_db)):

    existe = db.query(modelos.Proyector).filter(modelos.Proyector.id_proyector == proyector.id_proyector).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un proyector con esta clave")
    
    nuevo_proyector = modelos.Proyector(
        id_proyector=proyector.id_proyector,
        descripcion=proyector.descripcion,
        estado="Disponible" 
    )
    db.add(nuevo_proyector)
    db.commit()
    db.refresh(nuevo_proyector)
    return nuevo_proyector

@app.get("/api/proyectores", response_model=list[esquemas.ProyectorRespuesta])
def obtener_todos_los_proyectores(db: Session = Depends(get_db)):
    """Retorna TODOS los proyectores ACTIVOS (Disponibles y En Uso) para el Panel de Administración"""
    proyectores = db.query(modelos.Proyector).filter(modelos.Proyector.activo == True).all()
    return proyectores

@app.delete("/api/proyectores/{id_proyector}")
def eliminar_proyector(id_proyector: str, db: Session = Depends(get_db)):
    """Elimina un proyector (Borrado Lógico)"""
    proyector_db = db.query(modelos.Proyector).filter(modelos.Proyector.id_proyector == id_proyector).first()
    if not proyector_db:
        raise HTTPException(status_code=404, detail="Proyector no encontrado")
    
    proyector_db.activo = False # Se apaga en lugar de borrar
    db.commit()
    return {"mensaje": "Proyector dado de baja correctamente (Historial conservado)"}

