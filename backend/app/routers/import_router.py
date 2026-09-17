"""
Import des propres données d'une entreprise (CSV), depuis l'interface.

C'est ce qui permet à chaque entreprise cliente d'utiliser la plateforme
avec son propre secteur, ses propres prospects et ses propres clients,
au lieu des données togolaises de démonstration.
"""
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..services.auth import get_current_company
from ..services.csv_import import (
    import_prospects_df,
    import_clients_df,
    import_offers_df,
    import_sector_stats_df,
)

router = APIRouter(prefix="/import", tags=["Import de données"])


def _read_csv(file: UploadFile) -> pd.DataFrame:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV (.csv).")
    content = file.file.read()
    try:
        return pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Impossible de lire ce fichier CSV : {exc}")


@router.post("/prospects")
def import_prospects(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """
    Colonnes attendues : prospect_id, entreprise, secteur, taille_effectif,
    ville, contact, fonction_contact, email, canal_prefere, besoin_potentiel,
    source, statut, date_dernier_contact, prochaine_relance.

    Toutes les colonnes sont facultatives sauf `prospect_id` et `entreprise` —
    les autres peuvent être vides.
    """
    df = _read_csv(file)
    if "prospect_id" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Colonne 'prospect_id' manquante dans le fichier — voir le modèle CSV.",
        )
    count = import_prospects_df(df, company.id, db)
    return {"imported": count, "message": f"{count} nouveaux prospects importés."}


@router.post("/clients")
def import_clients(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Colonnes attendues : client_id, entreprise, secteur, service_achete, montant_annuel_fcfa."""
    df = _read_csv(file)
    count = import_clients_df(df, company.id, db)
    return {"imported": count, "message": f"{count} nouveaux clients importés."}


@router.post("/offers")
def import_offers(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Colonnes attendues : offre_id, service, description."""
    df = _read_csv(file)
    count = import_offers_df(df, company.id, db)
    return {"imported": count, "message": f"{count} offres importées."}


@router.post("/sector-stats")
def import_sector_stats(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """
    Colonnes attendues : secteur, prospects_contactes, reponses, rendez_vous,
    propositions_envoyees, conversions. Utilisé par le moteur IA pour évaluer
    la performance historique de chaque secteur.
    """
    df = _read_csv(file)
    count = import_sector_stats_df(df, company.id, db)
    return {"imported": count, "message": f"{count} statistiques sectorielles importées."}
