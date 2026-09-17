"""
Abstraction pour appeler une vraie API LLM.

Fournisseurs supportés (tous configurables dans le fichier .env) :
  - groq        → gratuit, sans carte bancaire, très rapide (recommandé)
  - gemini      → Google AI Studio, gratuit, sans carte
  - openrouter  → agrégateur de modèles, offre gratuite disponible
  - openai      → payant
  - anthropic   → payant (API Claude native)
  - none        → aucun appel réseau, moteur de règles uniquement

Tant qu'aucune clé n'est configurée (AI_API_KEY vide ou AI_PROVIDER=none),
`call_llm()` renvoie None et les services (scoring.py, messages.py,
assistant.py) utilisent leur moteur "règles" de secours. Le prototype
fonctionne donc parfaitement sans aucune clé.

Dès qu'une clé est ajoutée dans .env, tout passe automatiquement à la vraie
IA, sans changer une ligne de code ailleurs dans le projet.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "none").lower().strip()
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()

# Tous ces fournisseurs parlent le même protocole que l'API OpenAI :
# on change juste l'adresse du serveur, le code d'appel reste identique.
OPENAI_COMPATIBLE_URLS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
}

# Modèle utilisé par défaut si AI_MODEL n'est pas précisé dans .env
DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "gemini": "gemini-2.5-flash",
    "openrouter": "meta-llama/llama-3.3-70b-instruct:free",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-20241022",
}

SUPPORTED_PROVIDERS = set(OPENAI_COMPATIBLE_URLS) | {"anthropic"}

AI_MODEL = os.getenv("AI_MODEL", "").strip() or DEFAULT_MODELS.get(AI_PROVIDER, "")

# Permet de forcer une autre adresse (fournisseur non listé ci-dessus)
AI_BASE_URL = os.getenv("AI_BASE_URL", "").strip()


def ai_is_configured() -> bool:
    """Vrai si une clé valide ET un fournisseur reconnu sont configurés."""
    return bool(AI_API_KEY) and AI_PROVIDER in SUPPORTED_PROVIDERS


def ai_info() -> dict:
    """Renvoie l'état de la configuration IA (affiché par GET /ai/status)."""
    return {
        "ai_configured": ai_is_configured(),
        "provider": AI_PROVIDER if ai_is_configured() else "aucun (moteur de règles)",
        "model": AI_MODEL if ai_is_configured() else None,
    }


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str | None:
    """
    Appelle le LLM configuré. Renvoie le texte généré, ou None si aucune clé
    n'est configurée ou en cas d'erreur réseau (le code appelant utilise alors
    son fallback basé sur des règles — la démo ne casse jamais).
    """
    if not ai_is_configured():
        return None

    try:
        if AI_PROVIDER == "anthropic":
            return _call_anthropic(system_prompt, user_prompt, max_tokens)
        return _call_openai_compatible(system_prompt, user_prompt, max_tokens)
    except Exception as exc:  # on ne casse jamais l'API si le LLM échoue
        print(f"[ai_client] Appel LLM échoué, fallback règles utilisé : {exc}")
        return None


def _call_anthropic(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": AI_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": AI_MODEL,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    data = response.json()
    return "".join(block.get("text", "") for block in data.get("content", []))


def _call_openai_compatible(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    """
    Fonctionne pour Groq, Gemini, OpenRouter et OpenAI : même format de requête,
    seule l'adresse du serveur change.
    """
    url = AI_BASE_URL or OPENAI_COMPATIBLE_URLS[AI_PROVIDER]
    response = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": AI_MODEL,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
