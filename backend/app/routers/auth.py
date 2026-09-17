"""
Inscription et connexion des entreprises clientes (compte SaaS).

Chaque entreprise qui s'inscrit démarre avec une base de données vide :
elle importe ensuite ses propres prospects via /import/prospects
(voir routers/import_router.py).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.auth import generate_token, get_current_company

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/register", response_model=schemas.AuthResponse, status_code=201)
def register(payload: schemas.CompanyRegister, db: Session = Depends(get_db)):
    existing = db.query(models.Company).filter(models.Company.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une entreprise est déjà inscrite avec cet email.")

    company = models.Company(
        name=payload.name,
        sector=payload.sector,
        email=payload.email,
        password=payload.password,  # démo uniquement, voir services/auth.py
        token=generate_token(),
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    return schemas.AuthResponse(token=company.token, company=company)


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.CompanyLogin, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.email == payload.email).first()
    if not company or company.password != payload.password:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    # on régénère un jeton à chaque connexion
    company.token = generate_token()
    db.commit()
    db.refresh(company)

    return schemas.AuthResponse(token=company.token, company=company)


@router.get("/me", response_model=schemas.CompanyOut)
def me(company: models.Company = Depends(get_current_company)):
    return company


@router.post("/logout", status_code=204)
def logout(
    company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    company.token = None
    db.commit()
    return None
