import { useState } from "react";
import {
  Target,
  BadgeCheck,
  Send,
  BellRing,
  Trophy,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { BRAND } from "../brand";
import WakingNotice from "../components/WakingNotice";

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
  { Icon: Target, tint: "blue", title: "Identifier", text: "Trouvez les bonnes cibles" },
  { Icon: BadgeCheck, tint: "violet", title: "Qualifier", text: "Évaluez leur pertinence" },
  { Icon: Send, tint: "emerald", title: "Prospecter", text: "Contactez-les facilement" },
  { Icon: BellRing, tint: "sky", title: "Relancer", text: "Ne ratez plus une opportunité" },
  { Icon: Trophy, tint: "amber", title: "Convertir", text: "Transformez vos prospects" },
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sector: SECTORS[0],
    email: "",
    password: "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

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

  const inputClass =
    "w-full rounded-xl border border-[var(--border-soft)] bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/15 focus:border-[var(--color-brand-blue)]/30";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Panneau gauche : présentation ---------- */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[var(--color-brand-blue)] px-14 py-12 text-white">
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[var(--color-brand-yellow)]/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={BRAND.logoIcon} alt={BRAND.name} className="h-11 w-11 rounded-xl" />
            <p className="text-lg font-bold tracking-tight">{BRAND.name}</p>
          </div>
          <span className="rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Espace commercial
          </span>
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
            Trouvez les bons{" "}
            <span className="text-[var(--color-brand-yellow)]">prospects</span>
            <br />
            sans perdre de temps.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
            Notre intelligence artificielle vous aide à identifier, qualifier,
            prospecter, relancer puis convertir les prospects les plus pertinents
            pour votre activité.
          </p>

          <div className="mt-12 grid grid-cols-5 gap-3">
            {FEATURES.map(({ Icon, tint, title, text }) => (
              <div key={title}>
                <span
                  className="icon-chip mb-3 h-11 w-11"
                  style={{
                    backgroundColor: `var(--tint-${tint}-bg)`,
                    color: `var(--tint-${tint}-fg)`,
                  }}
                >
                  <Icon size={19} strokeWidth={2.1} />
                </span>
                <p className="text-[13px] font-semibold">{title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/40">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/35">
          <ShieldCheck size={14} strokeWidth={2} />
          Chaque entreprise dispose de son propre espace privé et sécurisé.
        </div>
      </div>

      {/* ---------- Panneau droit : formulaire ---------- */}
      <div className="app-surface flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src={BRAND.logoIcon} alt={BRAND.name} className="h-10 w-10 rounded-xl" />
            <p className="text-lg font-bold text-[var(--color-brand-blue)]">{BRAND.name}</p>
          </div>

          <p className="mb-2 text-sm text-slate-500">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-semibold text-[var(--color-brand-blue)] underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>

          <h2 className="text-[34px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            {mode === "login" ? "Bon retour !" : "Créer un compte"}
          </h2>
          <p className="mb-8 mt-2 text-sm leading-relaxed text-slate-500">
            {mode === "login"
              ? "Connectez-vous à votre espace pour accéder à votre tableau de bord."
              : "Créez l'espace de votre entreprise en quelques secondes."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                    Nom de l'entreprise
                  </label>
                  <div className="relative">
                    <Building2
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                      placeholder="Ex : Nova Digital"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                    Secteur d'activité
                  </label>
                  <div className="relative">
                    <Briefcase
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.sector}
                      onChange={(e) => update("sector", e.target.value)}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={4}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
                {error}
              </p>
            )}

            {loading && <WakingNotice />}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-blue)] py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(11,37,69,0.6)] transition-all hover:bg-[var(--color-brand-blue-light)] disabled:opacity-60"
            >
              {loading
                ? "Veuillez patienter…"
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
            Vos prospects, vos offres et vos statistiques restent strictement privés.
          </p>
        </div>
      </div>
    </div>
  );
}
