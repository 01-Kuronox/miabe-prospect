"""
Point d'entrée de l'API FastAPI — Miabé Prospect.
Pour lancer : uvicorn app.main:app --reload
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import prospects, followups, pipeline, dashboard, ai, auth, import_router

app = FastAPI(
    title="Miabé Prospect API",
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

    # Avertissement bien visible dans les journaux de l'hébergeur : sur un plan
    # gratuit, le disque est remis à zéro à chaque mise en veille, donc une base
    # SQLite y perd toutes les données des entreprises inscrites.
    from .database import IS_SQLITE

    if IS_SQLITE:
        print(
            "⚠️  Base SQLite en cours d'utilisation. En local c'est normal ; "
            "en ligne, les données seront PERDUES à chaque redémarrage. "
            "Définissez DATABASE_URL avec une adresse PostgreSQL."
        )

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


@app.get("/health", tags=["Santé"])
def health():
    return {"status": "healthy"}


@app.get("/", tags=["Santé"])
def root():
    return {"status": "ok", "service": "Miabé Prospect API"}


# ---------------------------------------------------------------------------
# Mode local : un seul programme sert l'API ET l'interface
# ---------------------------------------------------------------------------
# Si le dossier `frontend_dist/` existe à côté du backend (version locale,
# livrée avec l'interface déjà compilée), on enveloppe l'API dans une
# application qui sert aussi les pages du site :
#
#     /api/...  -> l'API (mêmes routes qu'en ligne, préfixées)
#     /...      -> les pages du site, index.html pour la navigation React
#
# Le préfixe /api est indispensable : sans lui, une adresse comme /prospects
# désignerait à la fois une route de l'API et une page du site.
#
# En ligne (Render), ce dossier n'existe pas : rien ne change, l'API répond
# à la racine et c'est Vercel qui sert l'interface.
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend_dist")

if os.path.isdir(FRONTEND_DIST):
    api_app = app

    app = FastAPI(
        title="Miabé Prospect — version locale",
        description="Interface et API réunies dans un seul programme, sans internet.",
        docs_url=None,
        redoc_url=None,
    )

    # Les applications montées ne reçoivent pas l'événement de démarrage du
    # parent : on appelle donc explicitement la même initialisation
    # (création des tables + données de démo si la base est vide).
    @app.on_event("startup")
    def _startup_local():
        on_startup()

    app.mount("/api", api_app)

    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        """Sert un fichier du site, ou la page principale (navigation React)."""
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
