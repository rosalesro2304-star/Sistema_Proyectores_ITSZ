from app.database import SessionLocal
from app.models import modelos

def poblar_base_de_datos():
    # Abrimos una sesión directa con PostgreSQL
    db = SessionLocal()

    print("Iniciando sembrado de datos de prueba...")

    # 1. Lista de Docentes de prueba
    nombres_maestros = [
        "Ing. Selene Vásquez",
        "Mtro. Alejandro Romero",
        "Lic. Juan Carlos Pérez",
        "Ing. María Fernández",
        "Dr. Roberto Gómez"
    ]

    for nombre in nombres_maestros:
        # Creamos el objeto y lo preparamos para guardar
        nuevo_docente = modelos.Docente(nombre_completo=nombre)
        db.add(nuevo_docente)

    # 2. Lista de Proyectores de prueba
    proyectores_datos = [
        {"id": "V-1", "desc": "Cañón EPSON Blanco"},
        {"id": "V-2", "desc": "Cañón BenQ Negro"},
        {"id": "V-3", "desc": "Cañón EPSON (HDMI integrado)"},
        {"id": "V-4", "desc": "Cañón ViewSonic"},
        {"id": "13", "desc": "Cañón Sony Antiguo (Solo VGA)"}
    ]

    for p in proyectores_datos:
        nuevo_proyector = modelos.Proyector(
            id_proyector=p["id"],
            descripcion=p["desc"],
            estado="Disponible"  # Todos nacen disponibles
        )
        db.add(nuevo_proyector)

    try:
        # Empujamos todo a PostgreSQL al mismo tiempo
        db.commit()
        print("¡Éxito! 5 Maestros y 5 Cañones registrados correctamente.")
    except Exception as e:
        db.rollback()
        print(f"Hubo un error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    poblar_base_de_datos()