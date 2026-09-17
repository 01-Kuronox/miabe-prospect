"""
Configuration de la base de données SQLite via SQLAlchemy.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prospectai.db")

# check_same_thread=False est nécessaire pour SQLite + FastAPI (plusieurs threads)
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dépendance FastAPI : fournit une session DB et la ferme proprement."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
