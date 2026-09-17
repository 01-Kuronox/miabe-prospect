"""
Moteur de scoring / qualification / priorisation (sections 9, 10, 11 du
cahier des charges).

Fonctionne par défaut avec un système de règles transparent (pas besoin de
clé API, résultat 100% explicable). Si une clé LLM est configurée, elle peut
en plus reformuler/affiner l'explication (voir `explain_with_ai`).
"""
import json
from sqlalchemy.orm import Session

from .. import models
from .ai_client import call_llm

# Offres vendues par la PME (utilisé pour vérifier qu'un besoin correspond à
# une offre réelle du catalogue).
OFFER_KEYWORDS = [
    "Développement web", "Application mobile", "Automatisation",
    "Marketing digital", "Data/BI", "CRM",
]

POSITIVE_RESULTS = {
    "Rendez-vous fixé": 10,
    "Réponse positive": 8,
    "Promesse de réponse": 5,
    "Demande d'information": 5,
}
NEUTRAL_RESULTS = {
    "À rappeler": 2,
}
NEGATIVE_RESULTS = {
    "Sans réponse": -3,
    "Pas intéressé": -15,
}


def _sector_score(sector: str, company_id: int, db: Session) -> tuple[float, str]:
    """Score sur 30 points selon la performance historique du secteur (pour cette entreprise)."""
    if not sector:
        return 10.0, "Secteur non renseigné (score neutre)"

    stat = (
        db.query(models.SectorStat)
        .filter(models.SectorStat.sector == sector, models.SectorStat.company_id == company_id)
        .first()
    )
    if not stat or not stat.prospects_contacted:
        return 15.0, f"Secteur « {sector} » : pas d'historique disponible (score neutre)"

    conversion_rate = stat.conversions / stat.prospects_contacted
    # Barème : 0% -> 5 pts, ~15% -> 20 pts, 30%+ -> 30 pts
    points = min(30.0, 5.0 + conversion_rate * 100 * 0.85)
    return round(points, 1), (
        f"Secteur « {sector} » : {stat.conversions}/{stat.prospects_contacted} "
        f"conversions historiques ({conversion_rate * 100:.0f}%)"
    )


def _engagement_score(prospect_id: int, db: Session) -> tuple[float, str]:
    """Score sur 30 points selon l'historique d'interactions."""
    activities = db.query(models.Activity).filter(models.Activity.prospect_id == prospect_id).all()
    if not activities:
        return 12.0, "Aucune interaction enregistrée pour l'instant (score neutre)"

    raw = 12.0  # base neutre
    positives, negatives, meetings = 0, 0, 0
    for a in activities:
        result = (a.result or "").strip()
        if result in POSITIVE_RESULTS:
            raw += POSITIVE_RESULTS[result]
            positives += 1
            if result == "Rendez-vous fixé":
                meetings += 1
        elif result in NEUTRAL_RESULTS:
            raw += NEUTRAL_RESULTS[result]
        elif result in NEGATIVE_RESULTS:
            raw += NEGATIVE_RESULTS[result]
            negatives += 1

    points = max(0.0, min(30.0, raw))
    parts = []
    if meetings:
        parts.append(f"{meetings} rendez-vous obtenu(s)")
    if positives:
        parts.append(f"{positives} interaction(s) positive(s)")
    if negatives:
        parts.append(f"{negatives} interaction(s) négative(s)")
    detail = ", ".join(parts) if parts else f"{len(activities)} interaction(s) neutres"
    return round(points, 1), f"Historique d'interactions : {detail}"


def _size_score(size) -> tuple[float, str]:
    """Score sur 15 points : la cible idéale est la PME (10 à 50 employés)."""
    if not size:
        return 5.0, "Taille d'entreprise non renseignée"
    if 10 <= size <= 50:
        return 15.0, f"Taille ({size} employés) parfaitement dans la cible PME"
    if 5 <= size < 10 or 50 < size <= 100:
        return 10.0, f"Taille ({size} employés) proche de la cible PME"
    return 5.0, f"Taille ({size} employés) hors cible PME habituelle"


def _need_score(need: str, company_id: int, db: Session) -> tuple[float, str]:
    """
    Score sur 15 points : le besoin correspond-il à une offre du catalogue
    de CETTE entreprise ? On regarde d'abord les offres réellement importées
    par l'entreprise (table Offer), avec la liste OFFER_KEYWORDS générique
    en repli si l'entreprise n'a pas encore importé son propre catalogue.
    """
    if not need:
        return 3.0, "Aucun besoin identifié pour l'instant"

    need = need.strip()
    company_offers = {
        o.service.strip() for o in db.query(models.Offer).filter_by(company_id=company_id).all()
        if o.service
    }
    catalogue = company_offers or set(OFFER_KEYWORDS)

    if need in catalogue:
        return 15.0, f"Besoin « {need} » correspond directement à une offre du catalogue"
    return 8.0, f"Besoin « {need} » identifié mais hors catalogue standard"


def _contact_score(prospect: models.Prospect) -> tuple[float, str]:
    """Score sur 10 points : qualité des coordonnées disponibles."""
    points = 0.0
    details = []
    if prospect.email:
        points += 5.0
        details.append("email")
    if prospect.contact_name:
        points += 5.0
        details.append("contact nommé")
    if not details:
        return 0.0, "Aucune coordonnée de contact exploitable"
    return points, f"Contact exploitable : {', '.join(details)}"


def score_prospect(prospect: models.Prospect, db: Session) -> dict:
    """
    Calcule le score (0-100), la priorité et les raisons pour un prospect.
    Retourne un dict prêt à être sauvegardé / renvoyé par l'API.
    """
    s1, r1 = _sector_score(prospect.sector, prospect.company_id, db)
    s2, r2 = _engagement_score(prospect.id, db)
    s3, r3 = _size_score(prospect.size)
    s4, r4 = _need_score(prospect.need, prospect.company_id, db)
    s5, r5 = _contact_score(prospect)

    total = round(s1 + s2 + s3 + s4 + s5, 1)
    total = max(0.0, min(100.0, total))

    if total >= 80:
        priority = "Très élevée"
    elif total >= 60:
        priority = "Élevée"
    elif total >= 40:
        priority = "Moyenne"
    else:
        priority = "Faible"

    reasons = [r1, r2, r3, r4, r5]

    recommendation = _build_recommendation(prospect, total, priority)

    return {
        "score": total,
        "priority": priority,
        "reasons": reasons,
        "recommendation": recommendation,
    }


def _build_recommendation(prospect: models.Prospect, score: float, priority: str) -> str:
    channel = prospect.preferred_channel or "Email"
    name = prospect.contact_name or "le contact"

    if prospect.status == "Converti":
        return "Prospect déjà converti : préparer la transmission au département concerné."
    if prospect.status in ("Refusé", "Non intéressé", "Perdu"):
        return "Prospect classé sans suite : ne pas relancer sauf nouvel élément."

    if score >= 80:
        return f"Contacter {name} en priorité aujourd'hui via {channel} — fort potentiel."
    if score >= 60:
        return f"Planifier un contact avec {name} via {channel} cette semaine."
    if score >= 40:
        return f"Qualifier davantage {name} avant d'investir du temps commercial."
    return "Prospect à faible priorité pour le moment — surveiller sans relance immédiate."


def explain_with_ai(prospect: models.Prospect, rule_result: dict, company: models.Company | None = None) -> str:
    """
    Si une clé LLM est configurée, demande une explication plus naturelle
    du score. Sinon, renvoie une explication construite à partir des raisons
    déjà calculées par les règles.
    """
    fallback = (
        f"Score {rule_result['score']}/100 ({rule_result['priority']}). "
        + " ; ".join(rule_result["reasons"])
    )

    sector_context = f" du secteur {company.sector}" if company and company.sector else ""
    system_prompt = (
        f"Tu es l'assistant IA d'une plateforme de prospection commerciale pour "
        f"une entreprise{sector_context}. Explique en 2-3 phrases, "
        "en français, pourquoi ce prospect a reçu ce score, en te basant "
        "uniquement sur les éléments fournis. Sois concret et actionnable."
    )
    user_prompt = (
        f"Entreprise : {prospect.company_name}\n"
        f"Secteur : {prospect.sector}\n"
        f"Score calculé : {rule_result['score']}/100\n"
        f"Priorité : {rule_result['priority']}\n"
        f"Raisons du score : {json.dumps(rule_result['reasons'], ensure_ascii=False)}\n"
        f"Recommandation initiale : {rule_result['recommendation']}"
    )

    ai_text = call_llm(system_prompt, user_prompt, max_tokens=250)
    return ai_text.strip() if ai_text else fallback
