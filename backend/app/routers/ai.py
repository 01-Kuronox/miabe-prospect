"""
Endpoints IA : analyse/scoring, génération de message, assistant conversationnel.
Sections 9, 11, 12, 13, 21 du cahier des charges.

Toutes les routes sont cloisonnées par entreprise (voir services/auth.py).
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.scoring import score_prospect, explain_with_ai
from ..services.messages import generate_message
from ..services.assistant import handle_chat
from ..services.ai_client import ai_info
from ..services.auth import get_current_company

router = APIRouter(tags=["Intelligence Artificielle"])


def _get_owned_prospect(prospect_id: int, company: models.Company, db: Session) -> models.Prospect:
    prospect = (
        db.query(models.Prospect)
        .filter(models.Prospect.id == prospect_id, models.Prospect.company_id == company.id)
        .first()
    )
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect introuvable")
    return prospect


@router.get("/ai/status")
def ai_status():
    """Indique si une vraie clé LLM est configurée ou si on tourne en mode règles."""
    return ai_info()


@router.post("/prospects/{prospect_id}/analyze", response_model=schemas.AIAnalysisOut)
def analyze_prospect(
    prospect_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = _get_owned_prospect(prospect_id, company, db)

    result = score_prospect(prospect, db)
    explanation = explain_with_ai(prospect, result, company=company)

    analysis = models.AIAnalysis(
        prospect_id=prospect_id,
        score=result["score"],
        priority=result["priority"],
        reasons=json.dumps(result["reasons"], ensure_ascii=False),
        recommendation=explanation,
    )
    db.add(analysis)

    # L'IA calcule score/priorité automatiquement, mais NE décide plus seule
    # de qualifier le prospect à sa place : c'est un choix qui reste au
    # commercial (bouton "Qualifier" affiché dans l'interface quand pertinent).
    prospect.score = result["score"]
    prospect.priority = result["priority"]

    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/ai/score-all")
def score_all_prospects(
    force: bool = False,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    """
    Lance l'analyse IA sur les prospects DE L'ENTREPRISE CONNECTÉE.
    Par défaut, ne traite que ceux qui n'ont pas encore de score.
    Avec ?force=true, ré-analyse tout le monde (utile après une mise à jour
    des données ou pour rafraîchir les scores avant une démo).
    """
    query = db.query(models.Prospect).filter(models.Prospect.company_id == company.id)
    if not force:
        query = query.filter(models.Prospect.score.is_(None))
    prospects = query.all()
    updated = 0
    for prospect in prospects:
        result = score_prospect(prospect, db)
        prospect.score = result["score"]
        prospect.priority = result["priority"]

        analysis = models.AIAnalysis(
            prospect_id=prospect.id,
            score=result["score"],
            priority=result["priority"],
            reasons=json.dumps(result["reasons"], ensure_ascii=False),
            recommendation=result["recommendation"],
        )
        db.add(analysis)
        updated += 1

    db.commit()
    return {"scored": updated, "message": f"{updated} prospects analysés."}


@router.get("/prospects/{prospect_id}/analyses", response_model=list[schemas.AIAnalysisOut])
def list_analyses(
    prospect_id: int,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    _get_owned_prospect(prospect_id, company, db)
    return (
        db.query(models.AIAnalysis)
        .filter(models.AIAnalysis.prospect_id == prospect_id)
        .order_by(models.AIAnalysis.created_at.desc())
        .all()
    )


@router.post("/prospects/{prospect_id}/generate-message")
def generate_prospect_message(
    prospect_id: int,
    payload: schemas.MessageGenerateRequest,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    prospect = _get_owned_prospect(prospect_id, company, db)

    message = generate_message(prospect, tone=payload.tone, channel=payload.channel, company=company)

    # on sauvegarde le message généré dans la dernière analyse IA (ou on en crée une)
    last_analysis = (
        db.query(models.AIAnalysis)
        .filter(models.AIAnalysis.prospect_id == prospect_id)
        .order_by(models.AIAnalysis.created_at.desc())
        .first()
    )
    if last_analysis:
        last_analysis.generated_message = message
        db.commit()

    return {"prospect_id": prospect_id, "channel": payload.channel or prospect.preferred_channel, "message": message}


@router.post("/ai/chat", response_model=schemas.ChatResponse)
def chat(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    company: models.Company = Depends(get_current_company),
):
    reply = handle_chat(payload.message, payload.prospect_id, company.id, db)
    return schemas.ChatResponse(reply=reply)
