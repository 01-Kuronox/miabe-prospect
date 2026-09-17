"""
Schémas Pydantic : ce que l'API reçoit et renvoie (validation + documentation auto).
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator


# ---------- Entreprise (compte SaaS) ----------

class CompanyRegister(BaseModel):
    name: str
    sector: Optional[str] = None
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _basic_email_check(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Adresse email invalide")
        return v

    @field_validator("password")
    @classmethod
    def _password_length(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("Le mot de passe doit contenir au moins 4 caractères")
        return v


class CompanyLogin(BaseModel):
    email: str
    password: str


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sector: Optional[str] = None
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    company: CompanyOut


# ---------- Prospect ----------

class ProspectBase(BaseModel):
    company_name: str
    sector: Optional[str] = None
    size: Optional[int] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_name: Optional[str] = None
    contact_role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_channel: Optional[str] = None
    need: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = "Nouveau"
    last_contact_date: Optional[str] = None
    next_follow_up_date: Optional[str] = None


class ProspectCreate(ProspectBase):
    pass


class ProspectUpdate(BaseModel):
    company_name: Optional[str] = None
    sector: Optional[str] = None
    size: Optional[int] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_name: Optional[str] = None
    contact_role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_channel: Optional[str] = None
    need: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    last_contact_date: Optional[str] = None
    next_follow_up_date: Optional[str] = None


class ProspectOut(ProspectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: Optional[str] = None
    score: Optional[float] = None
    priority: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class StatusUpdate(BaseModel):
    status: str


# ---------- Activity ----------

class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prospect_id: int
    type: Optional[str] = None
    action: Optional[str] = None
    description: Optional[str] = None
    result: Optional[str] = None
    date: Optional[str] = None


class ActivityCreate(BaseModel):
    type: Optional[str] = None
    action: Optional[str] = None
    description: Optional[str] = None
    result: Optional[str] = None
    date: Optional[str] = None


# ---------- FollowUp ----------

class FollowUpCreate(BaseModel):
    prospect_id: int
    date: str
    channel: Optional[str] = None
    notes: Optional[str] = None


class FollowUpOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prospect_id: int
    date: str
    channel: Optional[str] = None
    status: str
    notes: Optional[str] = None


class FollowUpStatusUpdate(BaseModel):
    status: str  # planifiée | faite | annulée


# ---------- AI ----------

class AIAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prospect_id: int
    score: float
    priority: str
    reasons: str
    recommendation: Optional[str] = None
    generated_message: Optional[str] = None
    created_at: datetime


class MessageGenerateRequest(BaseModel):
    tone: Optional[str] = "professionnel"  # professionnel | chaleureux | direct
    channel: Optional[str] = None  # Email | LinkedIn | Téléphone | WhatsApp


class ChatRequest(BaseModel):
    message: str
    prospect_id: Optional[int] = None  # contexte optionnel : "analyse ce prospect"


class ChatResponse(BaseModel):
    reply: str


# ---------- Dashboard ----------

class DashboardOut(BaseModel):
    total_prospects: int
    qualified_prospects: int
    to_contact_today: int
    follow_ups_count: int
    converted_prospects: int
    conversion_rate: float
    priority_prospects: int
    recommended_actions: List[str]
