import { useState } from "react";
import { useAuth } from "../AuthContext";
import { BRAND } from "../brand";

const SECTORS = [
  "Technologie / Informatique",
  "Commerce / Distribution",
  "Agroalimentaire",
  "Finance / Assurance",
  "Santé",
  "Éducation",
  "BTP / Immobilier",
  "Transport / Logistique",
  "Tourisme / Hôtellerie",
  "Autre",
];

const FEATURES = [
  { icon: "🎯", title: "Identifier", text: "Trouvez les bonnes cibles" },
  { icon: "✅", title: "Qualifier", text: "Évaluez leur pertinence" },
  { icon: "📣", title: "Prospecter", text: "Contactez-les facilement" },
  { icon: "🔔", title: "Relancer", text: "Ne laissez plus filer une opportunité" },
  { icon: "🏆", title: "Convertir", text: "Transformez et classez vos prospects" },
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sector: SECTORS[0],
    email: "",
    password: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
      } else {
        await register({
          name: form.name.trim(),
          sector: form.sector,
          email: form.email.trim(),
          password: form.password,
        });
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panneau gauche : présentation / pitch — masqué sur mobile */}
      <div className="hidden lg:flex flex-col justify-between bg-[var(--color-brand-blue)] text-white px-14 py-12 relative overflow-hidden">
        {/* halo décoratif discret, dans le ton de la marque */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--color-brand-yellow)]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[var(--color-brand-yellow)]/5 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={BRAND.logoIcon} alt={BRAND.name} className="h-10 w-10 rounded-lg" />
            <p className="font-bold text-lg">{BRAND.name}</p>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/70">
            ESPACE COMMERCIAL
          </span>
        </div>

        <div className="relative">
          <h1 className="text-5xl font-black leading-[1.1] mb-6">
            Trouvez les bons{" "}
            <span className="text-[var(--color-brand-yellow)]">prospects</span> sans
            perdre de temps.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md mb-10">
            Notre intelligence artificielle vous aide à identifier, qualifier,
            prospecter, relancer puis convertir les prospects les plus pertinents
            pour votre activité.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg mb-2">
                  {f.icon}
                </span>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-[11px] text-white/50 leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-white/40">
          Chaque entreprise dispose de son propre espace privé et sécurisé.
        </p>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-brand-gray)]">
        <div className="w-full max-w-sm">
          {/* logo affiché seul sur mobile, puisque le panneau gauche est masqué */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img src={BRAND.logoIcon} alt={BRAND.name} className="h-10 w-10 rounded-lg" />
            <p className="font-bold text-lg text-[var(--color-brand-blue)]">{BRAND.name}</p>
          </div>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-[var(--color-brand-blue)]">
              {mode === "login" ? "Bon retour !" : "Créer un compte"}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-[var(--color-brand-blue)] hover:underline"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà inscrit ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-[var(--color-brand-blue)] hover:underline"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                    placeholder="Ex : Nova Digital"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secteur d'activité
                  </label>
                  <select
                    value={form.sector}
                    onChange={(e) => update("sector", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse e-mail
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={4}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-brand-blue)] text-white font-semibold py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading
                ? "Veuillez patienter..."
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Chaque entreprise dispose de son propre espace : vos prospects, vos
            offres et vos statistiques restent privés.
          </p>
        </div>
      </div>
    </div>
  );
}
