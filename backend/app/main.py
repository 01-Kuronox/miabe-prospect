"""
Point d'entrée de l'API FastAPI — ProspectAI.
Pour lancer : uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import prospects, followups, pipeline, dashboard, ai, auth, import_router

app = FastAPI(
    title="ProspectAI API",
    description="Plateforme intelligente de prospection commerciale (prototype hackathon).",
    version="0.1.0",
)

# Autoriser le frontend (React ou autre) à appeler l'API depuis un autre port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    # Sur un hébergement gratuit (Render, Railway...), le disque peut être
    # réinitialisé à chaque redéploiement. On réimporte automatiquement les
    # données de démo si la base est vide, pour que la démo reste toujours
    # utilisable sans intervention manuelle.
    from sqlalchemy.orm import Session
    from . import models
    from .import_data import run_import

    db = Session(bind=engine)
    try:
        company_count = db.query(models.Company).count()
    finally:
        db.close()

    if company_count == 0:
        try:
            run_import()
        except Exception as exc:  # pragma: no cover - ne doit jamais bloquer le démarrage
            print(f"⚠️ Import automatique des données de démo échoué : {exc}")


app.include_router(auth.router)
app.include_router(import_router.router)
app.include_router(prospects.router)
app.include_router(followups.router)
app.include_router(pipeline.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.get("/", tags=["Santé"])
def root():
    return {"status": "ok", "service": "ProspectAI API"}


@app.get("/health", tags=["Santé"])
def health():
    return {"status": "healthy"}
