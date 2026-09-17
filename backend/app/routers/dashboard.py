"""
Tableau de bord (section 16 du cahier des charges).
"""
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.auth import get_current_company

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    base = db.query(models.Prospect).filter(models.Prospect.company_id == company.id)

    total_prospects = base.count()

    qualified_prospects = base.filter(models.Prospect.status.notin_(["Nouveau"])).count()

    today = date.today().isoformat()
    to_contact_today = base.filter(models.Prospect.next_follow_up_date == today).count()

    follow_ups_count = (
        db.query(models.FollowUp)
        .join(models.Prospect, models.FollowUp.prospect_id == models.Prospect.id)
        .filter(models.Prospect.company_id == company.id, models.FollowUp.status == "planifiée")
        .count()
    )

    converted_prospects = base.filter(models.Prospect.status == "Converti").count()

    conversion_rate = (
        round((converted_prospects / total_prospects) * 100, 1) if total_prospects else 0.0
    )

    priority_prospects = base.filter(
        models.Prospect.priority.in_(["Très élevée", "Élevée"])
    ).count()

    # Recommandations simples pour la zone "Actions recommandées aujourd'hui"
    top_prospects = (
        base.filter(models.Prospect.status.notin_(["Converti", "Refusé", "Non intéressé", "Perdu"]))
        .order_by(models.Prospect.score.desc().nullslast())
        .limit(5)
        .all()
    )
    recommended_actions = [
        f"Contacter {p.company_name} ({p.sector or 'secteur inconnu'}) — score {p.score if p.score is not None else 'n/a'}"
        for p in top_prospects
    ]

    return schemas.DashboardOut(
        total_prospects=total_prospects,
        qualified_prospects=qualified_prospects,
        to_contact_today=to_contact_today,
        follow_ups_count=follow_ups_count,
        converted_prospects=converted_prospects,
        conversion_rate=conversion_rate,
        priority_prospects=priority_prospects,
        recommended_actions=recommended_actions,
    )
