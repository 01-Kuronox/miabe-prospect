"""
Assistant conversationnel (section 12 du cahier des charges).

Reconnaît les intentions courantes du commercial par mots-clés (fonctionne
sans clé API). Si une clé LLM est configurée, elle est utilisée pour les
questions qui ne correspondent à aucune intention connue, avec le contexte
de la plateforme en système prompt.

Toutes les fonctions sont scopées à `company_id` : un commercial ne voit et
ne manipule jamais que les prospects de sa propre entreprise.
"""
from datetime import date
from sqlalchemy.orm import Session

from .. import models
from .ai_client import call_llm
from .scoring import score_prospect
from .messages import generate_message


def _top_priority_prospects(db: Session, company_id: int, limit: int = 5) -> str:
    prospects = (
        db.query(models.Prospect)
        .filter(
            models.Prospect.company_id == company_id,
            models.Prospect.status.notin_(["Converti", "Refusé", "Non intéressé", "Perdu"]),
        )
        .order_by(models.Prospect.score.desc().nullslast())
        .limit(limit)
        .all()
    )
    if not prospects:
        return "Aucun prospect scoré pour l'instant. Lance d'abord une analyse IA."

    lines = ["Voici vos prospects prioritaires :"]
    for p in prospects:
        score_txt = f"{p.score}/100" if p.score is not None else "non scoré"
        lines.append(f"- {p.company_name} ({p.sector or 'secteur inconnu'}) — {score_txt}, statut : {p.status}")
    return "\n".join(lines)


def _follow_ups_today(db: Session, company_id: int) -> str:
    today = date.today().isoformat()
    follow_ups = (
        db.query(models.FollowUp)
        .join(models.Prospect, models.FollowUp.prospect_id == models.Prospect.id)
        .filter(models.Prospect.company_id == company_id, models.FollowUp.date == today)
        .all()
    )
    if not follow_ups:
        # on regarde aussi les prospects dont la prochaine relance tombe aujourd'hui
        prospects = (
            db.query(models.Prospect)
            .filter(models.Prospect.company_id == company_id, models.Prospect.next_follow_up_date == today)
            .all()
        )
        if not prospects:
            return "Aucune relance programmée pour aujourd'hui."
        lines = ["Relances prévues aujourd'hui (d'après les fiches prospects) :"]
        for p in prospects:
            lines.append(f"- {p.company_name} via {p.preferred_channel or 'canal non précisé'}")
        return "\n".join(lines)

    lines = ["Relances programmées aujourd'hui :"]
    for f in follow_ups:
        prospect = db.query(models.Prospect).filter(models.Prospect.id == f.prospect_id).first()
        name = prospect.company_name if prospect else f"Prospect #{f.prospect_id}"
        lines.append(f"- {name} via {f.channel or 'canal non précisé'} (statut : {f.status})")
    return "\n".join(lines)


def _get_owned_prospect(db: Session, company_id: int, prospect_id: int):
    return (
        db.query(models.Prospect)
        .filter(models.Prospect.id == prospect_id, models.Prospect.company_id == company_id)
        .first()
    )


def _analyze_prospect_text(db: Session, company_id: int, prospect_id: int) -> str:
    prospect = _get_owned_prospect(db, company_id, prospect_id)
    if not prospect:
        return f"Aucun prospect trouvé avec l'id {prospect_id}."

    result = score_prospect(prospect, db)
    reasons = "\n".join(f"  • {r}" for r in result["reasons"])
    return (
        f"Analyse de {prospect.company_name} :\n"
        f"Score : {result['score']}/100 — Priorité : {result['priority']}\n"
        f"Raisons :\n{reasons}\n"
        f"Recommandation : {result['recommendation']}"
    )


def _generate_message_text(db: Session, company_id: int, prospect_id: int) -> str:
    prospect = _get_owned_prospect(db, company_id, prospect_id)
    if not prospect:
        return f"Aucun prospect trouvé avec l'id {prospect_id}."
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    return generate_message(prospect, company=company)


def handle_chat(message: str, prospect_id: int | None, company_id: int, db: Session) -> str:
    text = message.lower().strip()

    if any(k in text for k in ["prioritaire", "priorité", "contacter aujourd'hui", "top prospect"]):
        return _top_priority_prospects(db, company_id)

    if any(k in text for k in ["relancer", "relance"]) and "aujourd" in text:
        return _follow_ups_today(db, company_id)
    if "relance" in text and prospect_id is None:
        return _follow_ups_today(db, company_id)

    if "analys" in text or ("pourquoi" in text and "score" in text):
        if prospect_id is not None:
            return _analyze_prospect_text(db, company_id, prospect_id)
        return "Précise l'identifiant du prospect à analyser (champ prospect_id)."

    if "génère" in text or "message" in text or "génér" in text:
        if prospect_id is not None:
            return _generate_message_text(db, company_id, prospect_id)
        return "Précise l'identifiant du prospect pour lequel générer un message (champ prospect_id)."

    # Rien reconnu : on tente une vraie IA si disponible, sinon message d'aide
    system_prompt = (
        "Tu es l'assistant intégré à une plateforme de prospection commerciale "
        "pour une PME. Réponds en français, de façon brève et utile, à la "
        "question du commercial."
    )
    ai_text = call_llm(system_prompt, message, max_tokens=300)
    if ai_text:
        return ai_text.strip()

    return (
        "Je peux répondre à des questions comme :\n"
        "- « Quels sont mes prospects prioritaires ? »\n"
        "- « Quels prospects dois-je relancer aujourd'hui ? »\n"
        "- « Analyse ce prospect » (avec prospect_id)\n"
        "- « Génère un message de prospection » (avec prospect_id)"
    )
