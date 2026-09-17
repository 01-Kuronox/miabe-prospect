"""
Vue pipeline commercial (section 14 du cahier des charges) :
regroupe les prospects par statut pour l'affichage en colonnes (kanban).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..services.auth import get_current_company

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

PIPELINE_STAGES = [
    "Nouveau",
    "Qualifié",
    "Contacté",
    "En discussion",
    "À relancer",
    "Converti",
]
CLOSED_STAGES = ["Refusé", "Non intéressé", "Perdu"]


@router.get("")
def get_pipeline(
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospects = db.query(models.Prospect).filter(models.Prospect.company_id == company.id).all()

    columns = {stage: [] for stage in PIPELINE_STAGES + CLOSED_STAGES}
    for p in prospects:
        stage = p.status if p.status in columns else "Nouveau"
        columns[stage].append({
            "id": p.id,
            "company_name": p.company_name,
            "sector": p.sector,
            "score": p.score,
            "priority": p.priority,
            "next_follow_up_date": p.next_follow_up_date,
        })

    return {
        "stages": PIPELINE_STAGES,
        "closed_stages": CLOSED_STAGES,
        "columns": columns,
        "counts": {stage: len(items) for stage, items in columns.items()},
    }
