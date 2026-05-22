from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de conexión a PostgreSQL
# Formato: postgresql://usuario:contraseña@servidor/nombre_base_de_datos
# TODO: Cambia 'tu_contraseña' por la clave que le pusiste a Postgres al instalarlo
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:ROSALES@localhost/sistema_proyectores"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para abrir y cerrar la conexión automáticamente
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()