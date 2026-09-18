"""
Import des propres données d'une entreprise (CSV), depuis l'interface.

C'est ce qui permet à chaque entreprise cliente d'utiliser la plateforme
avec son propre secteur, ses propres prospects et ses propres clients,
au lieu des données togolaises de démonstration.
"""
import io
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


def _read_csv(file: UploadFile) -> list[dict]:
    """
    Lit le CSV envoyé par l'utilisateur et renvoie une liste de lignes.

    pandas est importé ici (et non en haut du fichier) car il est lourd :
    le charger au démarrage rallongerait de plusieurs secondes chaque réveil
    du serveur sur l'hébergement gratuit, alors qu'il ne sert qu'aux uploads.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV (.csv).")
    content = file.file.read()
    try:
        import pandas as pd

        df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
        return df.where(df.notna(), None).to_dict("records")
    except HTTPException:
        raise
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
    rows = _read_csv(file)
    if rows and "prospect_id" not in rows[0]:
        raise HTTPException(
            status_code=400,
            detail="Colonne 'prospect_id' manquante dans le fichier — voir le modèle CSV.",
        )
    count = import_prospects_df(rows, company.id, db)
    return {"imported": count, "message": f"{count} nouveaux prospects importés."}


@router.post("/clients")
def import_clients(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Colonnes attendues : client_id, entreprise, secteur, service_achete, montant_annuel_fcfa."""
    rows = _read_csv(file)
    count = import_clients_df(rows, company.id, db)
    return {"imported": count, "message": f"{count} nouveaux clients importés."}


@router.post("/offers")
def import_offers(
    file: UploadFile = File(...),
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Colonnes attendues : offre_id, service, description."""
    rows = _read_csv(file)
    count = import_offers_df(rows, company.id, db)
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
    rows = _read_csv(file)
    count = import_sector_stats_df(rows, company.id, db)
    return {"imported": count, "message": f"{count} statistiques sectorielles importées."}
