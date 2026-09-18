"""
Configuration de la base de données via SQLAlchemy.

Deux bases sont possibles, choisies par la variable DATABASE_URL :

  - **PostgreSQL** (en ligne) : les données survivent aux redémarrages.
    C'est indispensable sur un hébergement gratuit, dont le disque est
    effacé à chaque mise en veille — une entreprise qui s'inscrit et
    importe ses prospects perdrait tout au bout de quelques minutes.

  - **SQLite** (par défaut, version locale) : un simple fichier, pratique
    pour travailler hors ligne ou faire une démonstration sans internet.

Le code métier est identique dans les deux cas : SQLAlchemy s'occupe des
différences de dialecte.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prospectai.db")


def _normalise(url: str) -> str:
    """
    Uniformise l'adresse fournie par l'hébergeur.

    Neon, Render, Heroku et consorts distribuent des adresses commençant par
    « postgres:// » ou « postgresql:// ». SQLAlchemy refuse la première et
    utiliserait psycopg2 pour la seconde, alors qu'on installe psycopg (v3).
    On force donc le pilote, sans toucher au reste de l'adresse (identifiants,
    nom de base, options comme sslmode).
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalise(DATABASE_URL)
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# check_same_thread n'existe que pour SQLite : le passer à PostgreSQL
# ferait échouer la connexion.
connect_args = {"check_same_thread": False} if IS_SQLITE else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    # Les PostgreSQL hébergés (Neon, Supabase…) coupent les connexions restées
    # inactives. Sans cette vérification, la première requête après une pause
    # échouerait avec « server closed the connection unexpectedly ».
    pool_pre_ping=not IS_SQLITE,
    # On renouvelle les connexions toutes les cinq minutes, avant que
    # l'hébergeur ne les ferme de son côté.
    pool_recycle=300 if not IS_SQLITE else -1,
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
