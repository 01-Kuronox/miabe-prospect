"""
Modèles de données (tables SQLite), basés sur le cahier des charges
et adaptés au jeu de données réel fourni pour le hackathon.

Évolution "SaaS multi-entreprises" : chaque entreprise cliente (Company)
a ses propres prospects, clients, offres et statistiques sectorielles.
Toutes les requêtes de l'API sont filtrées par l'entreprise connectée
(voir app/services/auth.py et le paramètre `company` de chaque route).
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from .database import Base


class Company(Base):
    """
    Une entreprise cliente de la plateforme (le "tenant" du SaaS).

    ⚠️ À ne pas confondre avec Prospect.company_name, qui est le nom de
    l'entreprise PROSPECTÉE (le client potentiel), pas celle qui utilise
    l'outil.
    """
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # nom de l'entreprise utilisatrice
    sector = Column(String, nullable=True)  # son propre domaine d'activité
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)  # démo uniquement, pas de vrai hash requis
    token = Column(String, unique=True, nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    prospects = relationship("Prospect", back_populates="company", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="company", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="company", cascade="all, delete-orphan")
    sector_stats = relationship("SectorStat", back_populates="company", cascade="all, delete-orphan")
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, default="commercial")  # dirigeant | commercial | bizdev
    password = Column(String, nullable=True)  # démo uniquement, pas de vrai hash requis pour le prototype

    company = relationship("Company", back_populates="users")

    __table_args__ = (
        UniqueConstraint("company_id", "email", name="uq_user_company_email"),
    )


class Prospect(Base):
    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    external_id = Column(String, index=True)  # ex: P001 (id venant du CSV), unique PAR entreprise

    company_name = Column(String, nullable=False)
    sector = Column(String, index=True)
    size = Column(Integer)  # taille_effectif
    location = Column(String, index=True)  # ville
    website = Column(String, nullable=True)

    contact_name = Column(String, nullable=True)
    contact_role = Column(String, nullable=True)  # fonction_contact
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    preferred_channel = Column(String, nullable=True)  # canal_prefere

    need = Column(String, nullable=True)  # besoin_potentiel
    source = Column(String, nullable=True)  # comment le prospect a été trouvé

    # Score / priorité (calculés par le moteur IA, section 9-10 du cahier des charges)
    score = Column(Float, nullable=True)
    priority = Column(String, nullable=True)  # Très élevée | Élevée | Moyenne | Faible

    # Statut du pipeline (section 14)
    status = Column(
        String, default="Nouveau", index=True
    )  # Nouveau, Qualifié, Contacté, En discussion, À relancer, Converti, Refusé, Non intéressé, Perdu

    last_contact_date = Column(String, nullable=True)  # date_dernier_contact (texte YYYY-MM-DD)
    next_follow_up_date = Column(String, nullable=True)  # prochaine_relance

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="prospects")
    activities = relationship("Activity", back_populates="prospect", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="prospect", cascade="all, delete-orphan")
    analyses = relationship("AIAnalysis", back_populates="prospect", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("company_id", "external_id", name="uq_prospect_company_external"),
    )


class Activity(Base):
    """Historique des interactions avec un prospect (issu de interactions.csv + actions manuelles)."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)

    type = Column(String)  # canal : Email, Téléphone, LinkedIn, WhatsApp...
    action = Column(String, nullable=True)  # ex: "Relance 1", "Réunion"
    description = Column(Text, nullable=True)  # commentaire
    result = Column(String, nullable=True)  # résultat de l'action
    date = Column(String, nullable=True)

    prospect = relationship("Prospect", back_populates="activities")


class FollowUp(Base):
    """Relances programmées (section 15 du cahier des charges)."""
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)

    date = Column(String, nullable=False)
    channel = Column(String, nullable=True)
    status = Column(String, default="planifiée")  # planifiée | faite | annulée
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="follow_ups")


class AIAnalysis(Base):
    """Historique des analyses IA d'un prospect (section 9 du cahier des charges)."""
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)

    score = Column(Float)
    priority = Column(String)
    reasons = Column(Text)  # JSON stringifié : liste des raisons
    recommendation = Column(Text, nullable=True)
    generated_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="analyses")


class Client(Base):
    """Clients déjà convertis (issu de clients.csv), sert de référence à l'IA pour le scoring."""
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    external_id = Column(String, index=True)
    company_name = Column(String)
    sector = Column(String)
    service_bought = Column(String)
    annual_amount_fcfa = Column(Float, nullable=True)

    company = relationship("Company", back_populates="clients")

    __table_args__ = (
        UniqueConstraint("company_id", "external_id", name="uq_client_company_external"),
    )


class Offer(Base):
    """Catalogue des offres/services de l'entreprise (issu de offres_services.csv)."""
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    external_id = Column(String, index=True)
    service = Column(String)
    description = Column(Text, nullable=True)

    company = relationship("Company", back_populates="offers")

    __table_args__ = (
        UniqueConstraint("company_id", "external_id", name="uq_offer_company_external"),
    )


class SectorStat(Base):
    """Historique de performance par secteur (issu de historique.csv), utilisé par le dashboard."""
    __tablename__ = "sector_stats"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    sector = Column(String, index=True)
    prospects_contacted = Column(Integer, default=0)
    responses = Column(Integer, default=0)
    meetings = Column(Integer, default=0)
    proposals_sent = Column(Integer, default=0)
    conversions = Column(Integer, default=0)

    company = relationship("Company", back_populates="sector_stats")
