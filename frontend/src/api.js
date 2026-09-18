/**
 * Adresse de l'API.
 *
 *  - En ligne (Vercel)   : VITE_API_URL pointe vers le serveur Render.
 *  - En version locale   : aucune variable n'est définie et le site est servi
 *                          par le backend lui-même → adresses relatives, donc
 *                          aucun réseau externe nécessaire.
 *  - En développement    : le serveur Vite tourne sur un autre port que l'API.
 */
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");
const TOKEN_KEY = "prospectai_token";

// --- Gestion du jeton d'authentification (stocké côté navigateur) ---
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Délais entre les tentatives (l'hébergement gratuit met ~50 s à se réveiller)
const RETRY_DELAYS = [1500, 3000, 5000, 8000];

/**
 * fetch qui réessaie au lieu d'abandonner à la première erreur.
 *
 * Deux cas sont retentés :
 *   - l'erreur réseau (fetch qui échoue) : serveur endormi, wifi qui cligne ;
 *   - les codes 502 / 503 / 504 : l'hébergeur répond à la place du serveur
 *     pendant qu'il redémarre.
 *
 * Seules les lectures (GET) sont retentées : rejouer un POST pourrait créer
 * deux fois la même relance ou le même prospect.
 */
async function fetchWithRetry(url, options) {
  const method = (options.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const attempts = canRetry ? RETRY_DELAYS.length : 0;

  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, options);
      if ([502, 503, 504].includes(res.status) && i < attempts) {
        await sleep(RETRY_DELAYS[i]);
        continue;
      }
      return res;
    } catch (err) {
      if (i < attempts) {
        await sleep(RETRY_DELAYS[i]);
        continue;
      }
      throw new Error(
        "Le serveur ne répond pas. S'il vient d'être mis en veille, il lui faut " +
          "environ une minute pour redémarrer — réessayez dans quelques secondes."
      );
    }
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  // Ne pas forcer Content-Type: JSON quand on envoie un FormData (upload CSV)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetchWithRetry(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Jeton invalide/expiré : on déconnecte proprement.
    clearToken();
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch (_) {
      /* pas de corps JSON */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Réveille le serveur au plus tôt.
 *
 * L'hébergement gratuit met l'API en veille après 15 minutes sans visite ;
 * elle met alors ~50 s à redémarrer. En envoyant cette requête dès l'ouverture
 * de la page (pendant l'écran d'accueil), le réveil démarre pendant que
 * l'utilisateur regarde l'animation et saisit ses identifiants, au lieu de
 * commencer seulement au moment de la connexion.
 */
export function warmUp() {
  return fetch(`${API_URL}/health`, { cache: "no-store" }).catch(() => {});
}

/**
 * Maintient l'API éveillée tant que l'application reste ouverte dans un onglet
 * (utile pendant une démonstration : le serveur ne se rendort jamais).
 */
export function startKeepAlive(intervalMs = 10 * 60 * 1000) {
  const id = setInterval(warmUp, intervalMs);
  return () => clearInterval(id);
}

export const api = {
  // Authentification / compte entreprise
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  // Import CSV (données propres à l'entreprise connectée)
  importProspects: (file) => uploadCsv("/import/prospects", file),
  importClients: (file) => uploadCsv("/import/clients", file),
  importOffers: (file) => uploadCsv("/import/offers", file),
  importSectorStats: (file) => uploadCsv("/import/sector-stats", file),

  // Prospects
  listProspects: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`/prospects${qs ? `?${qs}` : ""}`);
  },
  getProspect: (id) => request(`/prospects/${id}`),
  createProspect: (payload) =>
    request("/prospects", { method: "POST", body: JSON.stringify(payload) }),
  updateProspect: (id, payload) =>
    request(`/prospects/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProspect: (id) => request(`/prospects/${id}`, { method: "DELETE" }),
  updateStatus: (id, status) =>
    request(`/prospects/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  listActivities: (id) => request(`/prospects/${id}/activities`),
  addActivity: (id, payload) =>
    request(`/prospects/${id}/activities`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Pipeline
  getPipeline: () => request("/pipeline"),

  // Relances
  listFollowUps: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/follow-ups${qs ? `?${qs}` : ""}`);
  },
  createFollowUp: (payload) =>
    request("/follow-ups", { method: "POST", body: JSON.stringify(payload) }),
  updateFollowUpStatus: (id, status) =>
    request(`/follow-ups/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  deleteFollowUp: (id) => request(`/follow-ups/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => request("/dashboard"),

  // IA
  getAiStatus: () => request("/ai/status"),
  analyzeProspect: (id) => request(`/prospects/${id}/analyze`, { method: "POST" }),
  scoreAll: (force = false) =>
    request(`/ai/score-all${force ? "?force=true" : ""}`, { method: "POST" }),
  listAnalyses: (id) => request(`/prospects/${id}/analyses`),
  generateMessage: (id, payload = {}) =>
    request(`/prospects/${id}/generate-message`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  chat: (message, prospectId) =>
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, prospect_id: prospectId ?? null }),
    }),
};

function uploadCsv(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(path, { method: "POST", body: formData });
}
