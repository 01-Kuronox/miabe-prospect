"""
Gestion des prospects : CRUD, recherche/filtres, changement de statut,
consultation des activités liées.

Couvre la section 7 (gestion des prospects) et une partie de la section 21
(API principale) du cahier des charges.

Toutes les routes sont cloisonnées par entreprise (voir services/auth.py) :
une entreprise ne voit et ne modifie jamais que ses propres prospects.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..services.auth import get_current_company

router = APIRouter(prefix="/prospects", tags=["Prospects"])

# Statuts valides du pipeline (section 14 du cahier des charges)
VALID_STATUSES = [
    "Nouveau",
    "Qualifié",
    "Contacté",
    "En discussion",
    "À relancer",
    "Converti",
    "Refusé",
    "Non intéressé",
    "Perdu",
]


def _get_owned_prospect(prospect_id: int, company: models.Company, db: Session) -> models.Prospect:
    """Récupère un prospect en vérifiant qu'il appartient bien à l'entreprise connectée."""
    prospect = (
        db.query(models.Prospect)
        .filter(models.Prospect.id == prospect_id, models.Prospect.company_id == company.id)
        .first()
    )
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect introuvable")
    return prospect


@router.get("", response_model=List[schemas.ProspectOut])
def list_prospects(
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
    sector: Optional[str] = Query(None, description="Filtrer par secteur d'activité"),
    location: Optional[str] = Query(None, description="Filtrer par ville"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    min_score: Optional[float] = Query(None, description="Score minimum"),
    search: Optional[str] = Query(None, description="Recherche libre (nom entreprise, contact, email)"),
    sort_by: Optional[str] = Query("score", description="Tri : score | created_at | company_name"),
    order: Optional[str] = Query("desc", description="asc | desc"),
    limit: int = Query(200, le=500),
    offset: int = Query(0, ge=0),
):
    query = db.query(models.Prospect).filter(models.Prospect.company_id == company.id)

    if sector:
        query = query.filter(models.Prospect.sector == sector)
    if location:
        query = query.filter(models.Prospect.location == location)
    if status:
        query = query.filter(models.Prospect.status == status)
    if min_score is not None:
        query = query.filter(models.Prospect.score >= min_score)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Prospect.company_name.ilike(like),
                models.Prospect.contact_name.ilike(like),
                models.Prospect.email.ilike(like),
            )
        )

    sort_column = {
        "score": models.Prospect.score,
        "created_at": models.Prospect.created_at,
        "company_name": models.Prospect.company_name,
    }.get(sort_by, models.Prospect.score)

    if order == "asc":
        query = query.order_by(sort_column.asc().nullslast())
    else:
        query = query.order_by(sort_column.desc().nullslast())

    return query.offset(offset).limit(limit).all()


@router.post("", response_model=schemas.ProspectOut, status_code=201)
def create_prospect(
    payload: schemas.ProspectCreate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = models.Prospect(company_id=company.id, **payload.model_dump())
    db.add(prospect)
    db.commit()
    db.refresh(prospect)
    return prospect


@router.get("/{prospect_id}", response_model=schemas.ProspectOut)
def get_prospect(
    prospect_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    return _get_owned_prospect(prospect_id, company, db)


@router.put("/{prospect_id}", response_model=schemas.ProspectOut)
def update_prospect(
    prospect_id: int,
    payload: schemas.ProspectUpdate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = _get_owned_prospect(prospect_id, company, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prospect, field, value)

    db.commit()
    db.refresh(prospect)
    return prospect


@router.delete("/{prospect_id}", status_code=204)
def delete_prospect(
    prospect_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = _get_owned_prospect(prospect_id, company, db)
    db.delete(prospect)
    db.commit()
    return None


@router.put("/{prospect_id}/status", response_model=schemas.ProspectOut)
def update_status(
    prospect_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Statut invalide. Valeurs possibles : {', '.join(VALID_STATUSES)}",
        )

    prospect = _get_owned_prospect(prospect_id, company, db)
    prospect.status = payload.status
    db.commit()
    db.refresh(prospect)
    return prospect


@router.get("/{prospect_id}/activities", response_model=List[schemas.ActivityOut])
def list_activities(
    prospect_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    _get_owned_prospect(prospect_id, company, db)  # vérifie l'appartenance
    return (
        db.query(models.Activity)
        .filter(models.Activity.prospect_id == prospect_id)
        .order_by(models.Activity.date.desc())
        .all()
    )


@router.post("/{prospect_id}/activities", response_model=schemas.ActivityOut, status_code=201)
def add_activity(
    prospect_id: int,
    payload: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    _get_owned_prospect(prospect_id, company, db)  # vérifie l'appartenance

    activity = models.Activity(prospect_id=prospect_id, **payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
