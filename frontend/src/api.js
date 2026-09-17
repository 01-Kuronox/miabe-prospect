const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
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

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

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
