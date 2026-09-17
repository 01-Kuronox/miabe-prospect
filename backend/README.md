# ProspectAI — Backend

Prototype hackathon : plateforme intelligente de prospection commerciale (FastAPI + SQLite).

## Étape 1 — Fondations (terminée)

Ce qui est en place :
- Structure du projet (`app/models.py`, `app/schemas.py`, `app/database.py`)
- Base SQLite avec les tables : `prospects`, `activities`, `follow_ups`, `ai_analysis`, `clients`, `offers`, `sector_stats`, `users`
- Script d'import qui charge les 5 fichiers CSV fournis (`app/data/`) dans la base
- API FastAPI minimale (`/`, `/health`) pour vérifier que tout démarre

## Comment lancer ça chez toi (Windows)

Ouvre un terminal (PowerShell) dans le dossier `backend` :

```powershell
cd "C:\Users\HP ELITEBOOK\CascadeProjects\ProspectAI\backend"

# 1. Créer l'environnement virtuel Python (une seule fois)
python -m venv .venv

# 2. Activer l'environnement virtuel
.venv\Scripts\activate

# 3. Installer les dépendances (une seule fois, ou si requirements.txt change)
pip install -r requirements.txt

# 4. Importer les données (déjà fait une fois côté serveur, le fichier prospectai.db
#    est déjà rempli, mais tu peux relancer cette commande à tout moment sans risque
#    de doublons — l'import est idempotent)
python -m app.import_data

# 5. Lancer le serveur
uvicorn app.main:app --reload
```

Puis ouvre dans ton navigateur :
- http://127.0.0.1:8000/  → doit répondre `{"status":"ok",...}`
- http://127.0.0.1:8000/docs  → documentation interactive de l'API (Swagger)

Le fichier `prospectai.db` est déjà rempli avec :
- 150 prospects
- 40 clients
- 6 offres
- 40 statistiques sectorielles
- 250 interactions

## Étape 2 — API métier (terminée)

Nouveaux endpoints disponibles (visibles et testables directement dans http://127.0.0.1:8000/docs) :

- `GET /prospects` — liste avec filtres (`sector`, `location`, `status`, `min_score`, `search`) et tri
- `POST /prospects` — créer un prospect
- `GET /prospects/{id}` — fiche prospect
- `PUT /prospects/{id}` — modifier un prospect
- `DELETE /prospects/{id}` — supprimer un prospect
- `PUT /prospects/{id}/status` — changer le statut (pipeline)
- `GET /prospects/{id}/activities` — historique des interactions
- `POST /prospects/{id}/activities` — ajouter une interaction manuelle
- `GET /pipeline` — prospects regroupés par étape (vue kanban)
- `GET /follow-ups` — liste des relances (filtres `status`, `date`, `upcoming_only`)
- `POST /follow-ups` — programmer une relance
- `PUT /follow-ups/{id}/status` — marquer une relance comme faite/annulée
- `GET /dashboard` — indicateurs clés + actions recommandées

**Pour valider** : relance le serveur (`uvicorn app.main:app --reload` depuis `backend`, après avoir activé `.venv`) et ouvre http://127.0.0.1:8000/docs — tu dois voir 4 nouvelles sections : Prospects, Relances, Pipeline, Dashboard. Essaie par exemple `GET /dashboard` ou `GET /pipeline` directement depuis Swagger ("Try it out").

## Étape 3 — Moteur IA (terminée)

Nouveaux endpoints IA :

- `GET /ai/status` — dit si une vraie clé LLM est configurée (sinon mode "règles")
- `POST /prospects/{id}/analyze` — calcule le score IA (0-100), la priorité et les raisons pour un prospect, et enregistre l'analyse
- `POST /ai/score-all` — analyse tous les prospects qui n'ont pas encore de score (pratique pour la démo, déjà lancé une fois : la base livrée a **149 prospects déjà scorés**)
- `GET /prospects/{id}/analyses` — historique des analyses IA d'un prospect
- `POST /prospects/{id}/generate-message` — génère un message de prospection personnalisé (email, LinkedIn, WhatsApp ou script d'appel selon le canal)
- `POST /ai/chat` — assistant conversationnel : comprend "quels sont mes prospects prioritaires ?", "quels prospects relancer aujourd'hui ?", "analyse ce prospect" (+ `prospect_id`), "génère un message" (+ `prospect_id`)

**Important — comment ça marche sans clé API** : le scoring utilise un moteur de règles 100% transparent (performance historique du secteur, historique d'interactions, taille d'entreprise, adéquation du besoin avec le catalogue, qualité du contact). Chaque score est accompagné d'explications lisibles. Le jour où tu as une clé (Anthropic ou OpenAI), il suffit de :
1. copier `.env.example` en `.env`
2. mettre `AI_PROVIDER=anthropic` (ou `openai`) et coller ta clé dans `AI_API_KEY`
3. relancer le serveur

À partir de là, l'explication du score, la génération de message et l'assistant utilisent automatiquement la vraie IA — sans toucher au code.

**Pour valider** : ouvre http://127.0.0.1:8000/docs, section "Intelligence Artificielle". Essaie `GET /dashboard` (tu dois voir `priority_prospects` à un nombre élevé et des actions recommandées avec de vrais scores), puis `POST /prospects/1/analyze` ou `POST /ai/chat` avec `{"message": "Quels sont mes prospects prioritaires ?"}`.

## Étape 4 — Interface web (terminée)

Le frontend React + Tailwind est dans le dossier `frontend` (à côté de `backend`).

**⚠️ Une seule chose que je n'ai pas pu créer à distance : le fichier `.env` du frontend** (mesure de sécurité). Crée-le toi-même, c'est rapide :

1. Dans `CascadeProjects\ProspectAI\frontend`, crée un fichier nommé exactement `.env`
2. Mets dedans une seule ligne :
   ```
   VITE_API_URL=http://127.0.0.1:8000
   ```

**Pour lancer le frontend** (dans un *nouveau* terminal PowerShell, en gardant le backend lancé dans l'autre) :

```powershell
cd "C:\Users\HP ELITEBOOK\CascadeProjects\ProspectAI\frontend"

# 1. Installer les dépendances (une seule fois)
npm install

# 2. Lancer l'application
npm run dev
```

Puis ouvre http://127.0.0.1:5173 — tu dois voir le Dashboard avec les couleurs jaune/bleu.

Pages disponibles :
- **Dashboard** — indicateurs clés + actions recommandées par l'IA (bouton pour lancer l'analyse sur tous les prospects)
- **Prospects** — liste avec recherche et filtres (secteur, statut), score et priorité
- **Fiche prospect** (clic sur une entreprise) — infos, changement de statut, programmation de relance, analyse IA, génération de message, historique des interactions
- **Pipeline** — vue kanban par statut
- **Relances** — liste des relances programmées, avec bouton "marquer faite"
- **Assistant IA** — chat avec suggestions rapides

**Pour valider** : lance backend + frontend, ouvre http://127.0.0.1:5173, clique sur "⚡ Lancer l'analyse IA sur tous les prospects" dans le Dashboard, puis navigue dans Prospects → clique une entreprise → vérifie que l'analyse IA et la génération de message fonctionnent.

## Étape 5 — Finitions et soutenance (terminée)

- `SCENARIO_DEMO.md` — parcours de démo minuté (4 min) à suivre devant le jury
- `PENSE_BETE_PRESENTATION.md` — les 8 points obligatoires + réponses aux questions du jury
- `plan_secours_captures.zip` — 8 captures d'écran en cas de panne technique pendant la démo

---

## Brancher une vraie IA (gratuit, sans carte bancaire)

Le prototype tourne **parfaitement sans aucune clé API** (moteur de règles).
Ajouter une clé améliore la qualité des explications de score, des messages
générés et des réponses de l'assistant — mais n'est pas obligatoire.

### Option recommandée : Groq (gratuit, rapide, sans carte)

1. Va sur **https://console.groq.com** et crée un compte (bouton "Sign up",
   tu peux te connecter directement avec Google ou GitHub — aucune carte demandée).
2. Une fois connecté, va dans **API Keys** (menu de gauche) → bouton
   **"Create API Key"** → donne-lui un nom (ex: `prospectai`) → **Submit**.
3. **Copie la clé immédiatement** (elle commence par `gsk_...`) — elle ne sera
   plus affichée ensuite.
4. Dans le dossier `backend`, crée un fichier nommé exactement `.env`
   (au même endroit que `requirements.txt`) et mets dedans :

   ```
   AI_PROVIDER=groq
   AI_API_KEY=gsk_colle_ta_cle_ici
   AI_MODEL=llama-3.3-70b-versatile
   ```

   En PowerShell, depuis le dossier `backend`, tu peux aussi faire :
   ```powershell
   notepad .env
   ```
   (Windows demandera de créer le fichier — dis oui, colle les 3 lignes, enregistre.)

5. **Arrête le serveur** (Ctrl+C dans le terminal) et **relance-le** :
   ```powershell
   uvicorn app.main:app --reload
   ```

6. **Vérifie que ça a marché** : ouvre http://127.0.0.1:8000/ai/status
   - Sans clé : `{"ai_configured": false, "provider": "aucun (moteur de règles)"}`
   - Avec clé : `{"ai_configured": true, "provider": "groq", "model": "llama-3.3-70b-versatile"}`

### Autres fournisseurs gratuits

Le code accepte n'importe quel fournisseur compatible OpenAI. Il suffit de
changer les valeurs dans `.env` :

| Fournisseur | `AI_PROVIDER` | Où obtenir la clé | `AI_MODEL` suggéré |
|---|---|---|---|
| Groq | `groq` | https://console.groq.com/keys | `llama-3.3-70b-versatile` |
| Google Gemini | `gemini` | https://aistudio.google.com/apikey | `gemini-2.5-flash` |
| OpenRouter | `openrouter` | https://openrouter.ai/keys | `meta-llama/llama-3.3-70b-instruct:free` |

### Sécurité de la démo

Si la clé est invalide, expirée, ou si le WiFi tombe pendant la soutenance,
**l'application ne plante pas** : elle bascule automatiquement sur le moteur
de règles et continue de fonctionner normalement. Le fichier `.env` ne doit
jamais être partagé ni publié (il contient ta clé).
