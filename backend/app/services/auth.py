"""
Authentification par entreprise (multi-tenant SaaS).

Version volontairement simple pour un prototype de hackathon : pas de
hachage de mot de passe, pas de vrai JWT. Chaque connexion génère un jeton
aléatoire stocké directement sur la ligne de l'entreprise en base — c'est
largement suffisant pour démontrer le cloisonnement des données, et ça
survit aux redémarrages du serveur (contrairement à un simple dictionnaire
en mémoire).

⚠️ Pour une vraie mise en production, il faudrait :
  - hacher les mots de passe (ex: bcrypt/passlib)
  - utiliser de vrais tokens JWT avec expiration
  - gérer les tentatives de connexion, le renouvellement, etc.
"""
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models


def generate_token() -> str:
    return secrets.token_hex(24)


def get_current_company(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.Company:
    """
    Dépendance FastAPI : lit l'en-tête `Authorization: Bearer <token>`,
    retrouve l'entreprise correspondante, ou renvoie une erreur 401.

    À utiliser dans chaque route qui doit être cloisonnée par entreprise :
        def ma_route(company: models.Company = Depends(get_current_company)):
            ...
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Non authentifié. Connecte-toi et envoie le jeton reçu dans l'en-tête Authorization.",
        )

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Jeton d'authentification manquant.")

    company = db.query(models.Company).filter(models.Company.token == token).first()
    if not company:
        raise HTTPException(status_code=401, detail="Jeton d'authentification invalide ou expiré.")

    return company
