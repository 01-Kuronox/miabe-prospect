"""
Script d'import : charge les CSV fournis (prospects, clients, historique,
offres, interactions) dans la base SQLite, sous une entreprise de
démonstration ("Entreprise Démo — PME Togo").

Usage :
    python -m app.import_data
"""
import os
import pandas as pd

from .database import Base, engine, SessionLocal
from . import models
from .services.auth import generate_token
from .services.csv_import import (
    import_prospects_df,
    import_clients_df,
    import_offers_df,
    import_sector_stats_df,
    import_interactions_df,
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

DEMO_COMPANY_EMAIL = "demo@prospectai.local"
DEMO_COMPANY_NAME = "Entreprise Démo — PME Togo"
DEMO_COMPANY_PASSWORD = "demo1234"


def get_or_create_demo_company(db) -> models.Company:
    company = db.query(models.Company).filter_by(email=DEMO_COMPANY_EMAIL).first()
    if company:
        return company

    company = models.Company(
        name=DEMO_COMPANY_NAME,
        sector="Solutions informatiques",
        email=DEMO_COMPANY_EMAIL,
        password=DEMO_COMPANY_PASSWORD,
        token=generate_token(),
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def run_import():
    """Crée les tables si besoin, puis importe les données de démo."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        company = get_or_create_demo_company(db)

        prospects_df = pd.read_csv(
            os.path.join(DATA_DIR, "01_Prospection_prospects.csv"), encoding="utf-8-sig"
        )
        clients_df = pd.read_csv(
            os.path.join(DATA_DIR, "01_Prospection_clients.csv"), encoding="utf-8-sig"
        )
        offers_df = pd.read_csv(
            os.path.join(DATA_DIR, "01_Prospection_offres_services.csv"), encoding="utf-8-sig"
        )
        stats_df = pd.read_csv(
            os.path.join(DATA_DIR, "01_Prospection_historique.csv"), encoding="utf-8-sig"
        )
        interactions_df = pd.read_csv(
            os.path.join(DATA_DIR, "01_Prospection_interactions.csv"), encoding="utf-8-sig"
        )

        n_prospects = import_prospects_df(prospects_df, company.id, db)
        n_clients = import_clients_df(clients_df, company.id, db)
        n_offers = import_offers_df(offers_df, company.id, db)
        n_stats = import_sector_stats_df(stats_df, company.id, db)
        n_interactions = import_interactions_df(interactions_df, company.id, db)

        print(f"Import terminé pour « {company.name} » (email : {company.email}) :")
        print(f"  - {n_prospects} nouveaux prospects")
        print(f"  - {n_clients} nouveaux clients")
        print(f"  - {n_offers} offres")
        print(f"  - {n_stats} statistiques sectorielles")
        print(f"  - {n_interactions} nouvelles interactions")
        print()
        print("Identifiants de connexion pour la démo :")
        print(f"  Email     : {DEMO_COMPANY_EMAIL}")
        print(f"  Mot de passe : {DEMO_COMPANY_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run_import()
