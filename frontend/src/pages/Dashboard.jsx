import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BadgeCheck,
  PhoneCall,
  BellRing,
  Trophy,
  TrendingUp,
  Flame,
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "../api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [scoreMessage, setScoreMessage] = useState(null);

  const load = () => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const handleScoreAll = async () => {
    setScoring(true);
    setScoreMessage(null);
    try {
      const res = await api.scoreAll(true);
      setScoreMessage(res.message);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setScoring(false);
      setTimeout(() => setScoreMessage(null), 5000);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="card max-w-lg p-6">
          <p className="text-sm text-red-600">
            Impossible de contacter l'API ({error}).
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Si tu travailles en local, vérifie que le serveur FastAPI tourne bien.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-10 text-sm text-slate-400">Chargement du tableau de bord…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-8 lg:p-10">
      {/* En-tête */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-brand-blue)]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue globale de votre activité commerciale.
          </p>
        </div>

        <div className="text-right">
          <button
            onClick={handleScoreAll}
            disabled={scoring}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,37,69,0.7)] transition-colors hover:bg-[var(--color-brand-blue-light)] disabled:opacity-60"
          >
            <Sparkles size={16} strokeWidth={2.2} />
            {scoring ? "Analyse en cours…" : "Lancer l'analyse IA"}
          </button>
          {scoreMessage && (
            <p className="mt-2 flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 size={14} />
              {scoreMessage}
            </p>
          )}
        </div>
      </div>

      {/* Indicateurs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total prospects" value={data.total_prospects} Icon={Users} tint="blue" accent />
        <StatCard label="Prospects qualifiés" value={data.qualified_prospects} Icon={BadgeCheck} tint="violet" />
        <StatCard label="À contacter aujourd'hui" value={data.to_contact_today} Icon={PhoneCall} tint="sky" />
        <StatCard label="Relances planifiées" value={data.follow_ups_count} Icon={BellRing} tint="amber" />
        <StatCard label="Convertis" value={data.converted_prospects} Icon={Trophy} tint="emerald" />
        <StatCard label="Taux de conversion" value={`${data.conversion_rate}%`} Icon={TrendingUp} tint="emerald" />
        <StatCard label="Prospects prioritaires" value={data.priority_prospects} Icon={Flame} tint="amber" accent />
      </div>

      {/* Actions recommandées */}
      <div className="card p-6 lg:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span
            className="icon-chip h-10 w-10"
            style={{
              backgroundColor: "var(--tint-blue-bg)",
              color: "var(--tint-blue-fg)",
            }}
          >
            <Target size={19} strokeWidth={2.1} />
          </span>
          <div>
            <h2 className="font-bold tracking-tight text-[var(--color-brand-blue)]">
              Actions recommandées aujourd'hui
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Générées par le moteur IA à partir du score de chaque prospect.
            </p>
          </div>
        </div>

        {data.recommended_actions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune recommandation pour l'instant — lancez l'analyse IA ci-dessus.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.recommended_actions.map((action, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-slate-700 transition-colors hover:border-[var(--color-brand-yellow)]/50"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-yellow)] text-[11px] font-bold text-[var(--color-brand-blue)]">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/prospects"
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brand-blue)] transition-colors hover:text-[var(--color-brand-blue-light)]"
        >
          Voir tous les prospects
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
