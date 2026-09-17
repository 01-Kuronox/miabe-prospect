"""
Génération de messages de prospection personnalisés (section 13).
"""
from .. import models
from .ai_client import call_llm

TEMPLATES = {
    "Email": (
        "Objet : Une solution {need} pour {company}\n\n"
        "Bonjour {contact},\n\n"
        "Je me permets de vous contacter car nous accompagnons des entreprises "
        "du secteur {sector} dans leurs projets de {need_lower}.\n"
        "Au vu du profil de {company}, je pense que notre offre pourrait "
        "vraiment vous aider à gagner en efficacité.\n\n"
        "Auriez-vous 15 minutes cette semaine pour en discuter ?\n\n"
        "Bien cordialement,\n"
        "L'équipe commerciale"
    ),
    "LinkedIn": (
        "Bonjour {contact}, je vois que {company} évolue dans le secteur "
        "{sector}. Nous aidons des entreprises similaires sur des projets de "
        "{need_lower}. Seriez-vous ouvert(e) à un échange rapide ?"
    ),
    "WhatsApp": (
        "Bonjour {contact}, ici {sender} 👋. Nous travaillons avec des "
        "entreprises du secteur {sector} sur des projets de {need_lower}. "
        "Je serais ravi(e) d'échanger avec vous sur les besoins de {company}. "
        "Vous seriez disponible cette semaine ?"
    ),
    "Téléphone": (
        "Script d'appel :\n"
        "1. Se présenter et présenter l'entreprise.\n"
        "2. Mentionner que {company} pourrait bénéficier d'une solution de "
        "{need_lower}, comme d'autres entreprises du secteur {sector}.\n"
        "3. Poser une question ouverte sur leurs priorités actuelles.\n"
        "4. Proposer un rendez-vous de 15-20 minutes."
    ),
}

DEFAULT_TEMPLATE = TEMPLATES["Email"]


def generate_message(
    prospect: models.Prospect,
    tone: str = "professionnel",
    channel: str | None = None,
    company: models.Company | None = None,
) -> str:
    channel = channel or prospect.preferred_channel or "Email"
    need = prospect.need or "digitalisation de votre activité"

    # Le message s'adapte au secteur de l'ENTREPRISE UTILISATRICE (pas seulement
    # au prospect ciblé) — c'est ce qui permet à chaque entreprise cliente
    # d'obtenir des messages pertinents pour son propre métier.
    sender_context = (
        f"une entreprise du secteur {company.sector}" if company and company.sector
        else "une entreprise de solutions informatiques"
    )

    # 1. Essayer avec une vraie IA si une clé est configurée
    system_prompt = (
        f"Tu es un assistant commercial pour {sender_context}. Rédige un "
        "message de prospection court, en français, "
        f"adapté au canal {channel}, avec un ton {tone}. Ne mets aucune "
        "explication, uniquement le message final."
    )
    user_prompt = (
        f"Entreprise ciblée : {prospect.company_name}\n"
        f"Secteur : {prospect.sector}\n"
        f"Contact : {prospect.contact_name or 'N/A'} ({prospect.contact_role or 'N/A'})\n"
        f"Besoin potentiel : {need}\n"
        f"Canal : {channel}\n"
        f"Ton souhaité : {tone}"
    )
    ai_text = call_llm(system_prompt, user_prompt, max_tokens=300)
    if ai_text:
        return ai_text.strip()

    # 2. Sinon, message basé sur un template (toujours fonctionnel, sans clé API)
    template = TEMPLATES.get(channel, DEFAULT_TEMPLATE)
    return template.format(
        company=prospect.company_name,
        contact=prospect.contact_name or "Madame, Monsieur",
        sector=prospect.sector or "votre secteur",
        need=need,
        need_lower=need[0].lower() + need[1:] if need else "digitalisation",
        sender="l'équipe commerciale",
    )
