"""
Logique d'import CSV partagée entre :
  - app/import_data.py (import initial des données de démo, au démarrage)
  - app/routers/import_router.py (upload par une entreprise depuis l'interface)

Chaque fonction prend un DataFrame pandas déjà chargé + l'id de l'entreprise
concernée, et scope toutes les requêtes/insertions à cette entreprise — c'est
ce qui permet à plusieurs entreprises d'utiliser la plateforme sans jamais
voir les données des autres.

Colonnes attendues (mêmes noms que les fichiers CSV fournis pour le
hackathon) :
  - prospects  : prospect_id, entreprise, secteur, taille_effectif, ville,
                 contact, fonction_contact, email, canal_prefere,
                 besoin_potentiel, source, statut, date_dernier_contact,
                 prochaine_relance
  - clients    : client_id, entreprise, secteur, service_achete,
                 montant_annuel_fcfa
  - offres     : offre_id, service, description
  - historique : secteur, prospects_contactes, reponses, rendez_vous,
                 propositions_envoyees, conversions
"""
import pandas as pd
from sqlalchemy.orm import Session

from .. import models


def _clean(value):
    """Convertit les NaN pandas en None, et strippe les chaînes."""
    if pd.isna(value):
        return None
    if isinstance(value, str):
        value = value.strip()
        return value if value != "" else None
    return value


def _to_int(value):
    value = _clean(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _to_float(value):
    value = _clean(value)
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def import_prospects_df(df: pd.DataFrame, company_id: int, db: Session) -> int:
    df = df.drop_duplicates(subset=["prospect_id"], keep="first")

    seen_in_run = set()
    count = 0
    for _, row in df.iterrows():
        external_id = _clean(row.get("prospect_id"))
        if not external_id or external_id in seen_in_run:
            continue
        seen_in_run.add(external_id)

        existing = (
            db.query(models.Prospect)
            .filter_by(company_id=company_id, external_id=external_id)
            .first()
        )
        if existing:
            continue  # import idempotent : on ne double pas les données

        prospect = models.Prospect(
            company_id=company_id,
            external_id=external_id,
            company_name=_clean(row.get("entreprise")) or "Entreprise inconnue",
            sector=_clean(row.get("secteur")),
            size=_to_int(row.get("taille_effectif")),
            location=_clean(row.get("ville")),
            contact_name=_clean(row.get("contact")),
            contact_role=_clean(row.get("fonction_contact")),
            email=_clean(row.get("email")),
            preferred_channel=_clean(row.get("canal_prefere")),
            need=_clean(row.get("besoin_potentiel")),
            source=_clean(row.get("source")),
            status=_clean(row.get("statut")) or "Nouveau",
            last_contact_date=_clean(row.get("date_dernier_contact")),
            next_follow_up_date=_clean(row.get("prochaine_relance")),
        )
        db.add(prospect)
        count += 1

    db.commit()
    return count


def import_clients_df(df: pd.DataFrame, company_id: int, db: Session) -> int:
    count = 0
    for _, row in df.iterrows():
        external_id = _clean(row.get("client_id"))
        if not external_id:
            continue
        existing = (
            db.query(models.Client)
            .filter_by(company_id=company_id, external_id=external_id)
            .first()
        )
        if existing:
            continue

        client = models.Client(
            company_id=company_id,
            external_id=external_id,
            company_name=_clean(row.get("entreprise")),
            sector=_clean(row.get("secteur")),
            service_bought=_clean(row.get("service_achete")),
            annual_amount_fcfa=_to_float(row.get("montant_annuel_fcfa")),
        )
        db.add(client)
        count += 1

    db.commit()
    return count


def import_offers_df(df: pd.DataFrame, company_id: int, db: Session) -> int:
    count = 0
    for _, row in df.iterrows():
        external_id = _clean(row.get("offre_id"))
        if not external_id:
            continue
        existing = (
            db.query(models.Offer)
            .filter_by(company_id=company_id, external_id=external_id)
            .first()
        )
        if existing:
            continue

        offer = models.Offer(
            company_id=company_id,
            external_id=external_id,
            service=_clean(row.get("service")),
            description=_clean(row.get("description")),
        )
        db.add(offer)
        count += 1

    db.commit()
    return count


def import_sector_stats_df(df: pd.DataFrame, company_id: int, db: Session) -> int:
    # on repart de zéro pour cette table à chaque (ré)import, pour cette entreprise
    db.query(models.SectorStat).filter_by(company_id=company_id).delete()

    count = 0
    for _, row in df.iterrows():
        sector = _clean(row.get("secteur"))
        if not sector:
            continue

        stat = models.SectorStat(
            company_id=company_id,
            sector=sector,
            prospects_contacted=_to_int(row.get("prospects_contactes")) or 0,
            responses=_to_int(row.get("reponses")) or 0,
            meetings=_to_int(row.get("rendez_vous")) or 0,
            proposals_sent=_to_int(row.get("propositions_envoyees")) or 0,
            conversions=_to_int(row.get("conversions")) or 0,
        )
        db.add(stat)
        count += 1

    db.commit()
    return count


def import_interactions_df(df: pd.DataFrame, company_id: int, db: Session) -> int:
    # map external prospect_id (ex: P014) -> id interne, pour CETTE entreprise
    prospects_by_external = {
        p.external_id: p.id
        for p in db.query(models.Prospect).filter_by(company_id=company_id).all()
    }

    count = 0
    for _, row in df.iterrows():
        interaction_id = _clean(row.get("interaction_id"))
        prospect_external_id = _clean(row.get("prospect_id"))
        if not interaction_id or prospect_external_id not in prospects_by_external:
            continue

        prospect_id = prospects_by_external[prospect_external_id]

        date = _clean(row.get("date"))
        action = _clean(row.get("action"))
        already = (
            db.query(models.Activity)
            .filter_by(prospect_id=prospect_id, date=date, action=action)
            .first()
        )
        if already:
            continue

        activity = models.Activity(
            prospect_id=prospect_id,
            type=_clean(row.get("canal")),
            action=action,
            result=_clean(row.get("resultat")),
            description=_clean(row.get("commentaire")),
            date=date,
        )
        db.add(activity)
        count += 1

    db.commit()
    return count
