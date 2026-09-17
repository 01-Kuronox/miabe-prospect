# Miabé Prospect

Plateforme SaaS de prospection commerciale assistée par IA.
Chaque entreprise dispose de son propre espace : ses prospects, ses clients,
ses offres et ses statistiques restent strictement privés.

## Structure

- `backend/` — API FastAPI (Python) : authentification par entreprise, scoring IA,
  pipeline, relances, assistant conversationnel, import CSV.
- `frontend/` — Interface React (Vite + Tailwind CSS).

## Démarrage en local

Backend :

    cd backend
    pip install -r requirements.txt
    python -m app.import_data
    uvicorn app.main:app --reload

Frontend :

    cd frontend
    npm install
    npm run dev

Compte de démonstration : `demo@prospectai.local` / `demo1234`

## Déploiement

- Backend : Render (voir `render.yaml`)
- Frontend : Vercel (dossier racine `frontend`, variable `VITE_API_URL`)

---

Projet réalisé dans le cadre du hackathon ACAN Campus — Lomé Summer School 2026.
