# Pense-bête présentation — LSS 2026 (10 min + 5 min questions)

Toute l'équipe doit pouvoir répondre sur ces points (règle du guide : "tous les
membres de l'équipe doivent connaître le projet").

---

## 1. Le problème (1min30 — avec équipe/contexte)
Une PME de solutions informatiques veut développer son portefeuille client mais :
- la recherche de prospects est manuelle et chronophage ;
- une fois trouvés, il faut vérifier secteur, taille, localisation, besoins ;
- le suivi devient vite ingérable (relances à J+3, à 6 mois, prospects muets ou qui déclinent) ;
- les infos sont éparpillées dans plusieurs fichiers → aucune visibilité globale.

**Problématique :** comment permettre à une PME d'identifier, qualifier, prioriser
et suivre ses prospects jusqu'à la conversion — sans dix outils différents ?

## 2. Les utilisateurs
- **Dirigeant** : veut voir la performance globale et le pipeline d'un coup d'œil.
- **Commercial** : cherche, qualifie, contacte, relance, fait avancer chaque prospect.
- **Équipe Business Development** : identifie et priorise les nouvelles opportunités.

## 3. La solution (2 min)
Une plateforme web unique qui couvre tout le parcours :
**Identifier → Qualifier → Prioriser → Prospecter → Relancer → Convertir ou classer**

Elle centralise les prospects, calcule un score IA transparent, génère des
recommandations et des messages de prospection, et donne une vue pipeline (kanban)
+ un calendrier de relances. Un assistant conversationnel répond aux questions
courantes ("qui contacter aujourd'hui ?").

## 4. Démonstration (4 min)
→ Suivre `SCENARIO_DEMO.md` (parcours minuté précis). Points clés à montrer :
Dashboard → score IA expliqué sur une fiche prospect → message généré et modifiable
→ Pipeline → Relances → Assistant IA.

## 5. IA et valeur ajoutée (1 min)
- **Où l'IA intervient** : scoring de pertinence (0-100) basé sur 5 critères
  (secteur, historique d'engagement, taille d'entreprise, adéquation du besoin,
  qualité du contact), génération de messages personnalisés, assistant conversationnel.
- **Pourquoi ce choix** : ce sont les 3 tâches les plus chronophages et les plus
  sujettes à l'erreur humaine dans la prospection manuelle.
- **Valeur ajoutée** : chaque score est **expliqué** (raisons listées, pas une
  boîte noire) et **l'IA assiste sans décider à la place du commercial** — elle
  propose, le commercial valide (qualifier, modifier un message avant envoi).
- **Fonctionnement technique** : moteur de règles transparent aujourd'hui, conçu
  pour brancher une vraie clé LLM (Anthropic/OpenAI) sans changer le code —
  robustesse même sans API payante.

## 6. Impact et perspectives (1min30)
- **Bénéfices** : gain de temps sur la recherche/qualification, aucun prospect
  oublié (relances centralisées), décisions commerciales mieux argumentées
  (score + raisons), meilleure visibilité du dirigeant sur tout le portefeuille.
- **Limites actuelles** (à assumer, pas à cacher) :
  - le scoring est basé sur des règles métier, pas encore un LLM entraîné sur
    des données réelles de conversion ;
  - l'identification de nouveaux prospects se fait à partir d'un jeu de données
    préparé, pas encore d'un scraping/API externe en temps réel ;
  - pas encore d'envoi automatique des messages (choix assumé : garder l'humain
    dans la boucle).
- **Prochaines améliorations** :
  - brancher une vraie clé LLM pour affiner scoring et messages ;
  - connecter une source de données réelle (API d'entreprises, LinkedIn, etc.) ;
  - notifications automatiques (email/SMS) pour les relances du jour.

---

## Réponses probables aux questions du jury
- **"Et si l'IA se trompe ?"** → Le score est transparent (raisons affichées),
  et c'est toujours le commercial qui décide de qualifier ou non.
- **"Pourquoi pas d'envoi automatique des messages ?"** → Choix produit : un
  message mal calibré peut coûter un client ; on préfère un brouillon rapide
  à valider plutôt qu'un envoi automatique risqué.
- **"Combien de temps pour développer ça ?"** → Prototype réalisé en quelques
  jours (hackathon), architecture pensée pour évoluer (API + base de données
  déjà structurées, IA modulaire).
- **"Ça marche sans clé API payante ?"** → Oui, tout le scoring et les messages
  fonctionnent avec un moteur de règles ; une clé Anthropic/OpenAI est un
  simple bonus branché sans réécrire le code.

---

## Rappel pratique (règles du guide)
- 10 min chrono strict, signal donné avant la fin — ne pas dépasser.
- Préparer la démo à l'avance : avoir l'app déjà ouverte et chargée avant de monter.
- **Plan de secours obligatoire** : `plan_secours_captures.zip` (8 captures) en
  backup sur un téléphone/PC si le serveur ou le WiFi lâche.
- Tenue YAS obligatoire le jour des présentations.
