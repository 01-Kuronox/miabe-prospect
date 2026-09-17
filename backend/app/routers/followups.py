"""
Gestion des relances (section 15 du cahier des charges).

FollowUp n'a pas de company_id direct : le cloisonnement se fait via le
prospect associé (chaque relance est vérifiée comme appartenant à un
prospect de l'entreprise connectée).
"""
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.auth import get_current_company

router = APIRouter(prefix="/follow-ups", tags=["Relances"])


def _base_query(db: Session, company: models.Company):
    return (
        db.query(models.FollowUp)
        .join(models.Prospect, models.FollowUp.prospect_id == models.Prospect.id)
        .filter(models.Prospect.company_id == company.id)
    )


@router.get("", response_model=List[schemas.FollowUpOut])
def list_follow_ups(
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
    status: Optional[str] = Query(None, description="planifiée | faite | annulée"),
    on_date: Optional[str] = Query(None, alias="date", description="Filtrer sur une date précise YYYY-MM-DD"),
    upcoming_only: bool = Query(False, description="Ne montrer que les relances à venir"),
):
    query = _base_query(db, company)

    if status:
        query = query.filter(models.FollowUp.status == status)
    if on_date:
        query = query.filter(models.FollowUp.date == on_date)
    if upcoming_only:
        today = date.today().isoformat()
        query = query.filter(models.FollowUp.date >= today)

    return query.order_by(models.FollowUp.date.asc()).all()


@router.post("", response_model=schemas.FollowUpOut, status_code=201)
def create_follow_up(
    payload: schemas.FollowUpCreate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = (
        db.query(models.Prospect)
        .filter(models.Prospect.id == payload.prospect_id, models.Prospect.company_id == company.id)
        .first()
    )
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect introuvable")

    follow_up = models.FollowUp(**payload.model_dump())
    db.add(follow_up)

    # on met aussi à jour la date de prochaine relance sur la fiche prospect
    prospect.next_follow_up_date = payload.date

    db.commit()
    db.refresh(follow_up)
    return follow_up


@router.put("/{follow_up_id}/status", response_model=schemas.FollowUpOut)
def update_follow_up_status(
    follow_up_id: int,
    payload: schemas.FollowUpStatusUpdate,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    follow_up = _base_query(db, company).filter(models.FollowUp.id == follow_up_id).first()
    if not follow_up:
        raise HTTPException(status_code=404, detail="Relance introuvable")

    follow_up.status = payload.status
    db.commit()
    db.refresh(follow_up)
    return follow_up


@router.delete("/{follow_up_id}", status_code=204)
def delete_follow_up(
    follow_up_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    follow_up = _base_query(db, company).filter(models.FollowUp.id == follow_up_id).first()
    if not follow_up:
        raise HTTPException(status_code=404, detail="Relance introuvable")
    db.delete(follow_up)
    db.commit()
    return None
