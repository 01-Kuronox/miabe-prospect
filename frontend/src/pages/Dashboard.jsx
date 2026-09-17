import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      setScoreMessage(`✓ ${res.message}`);
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
        <p className="text-red-600">
          Impossible de contacter l'API ({error}). Vérifie que le serveur FastAPI tourne
          bien sur http://127.0.0.1:8000.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-slate-500">Chargement du dashboard…</div>;
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-brand-blue)]">
            Tableau de bord
          </h1>
          <p className="text-slate-500 text-sm">Vue globale de l'activité commerciale.</p>
        </div>
        <div className="text-right">
          <button
            onClick={handleScoreAll}
            disabled={scoring}
            className="rounded-lg bg-[var(--color-brand-yellow)] px-4 py-2 text-sm font-bold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-yellow-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scoring ? "Analyse en cours…" : "⚡ Lancer l'analyse IA sur tous les prospects"}
          </button>
          {scoreMessage && (
            <p className="mt-2 text-xs font-semibold text-emerald-600">{scoreMessage}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total prospects" value={data.total_prospects} accent />
        <StatCard label="Prospects qualifiés" value={data.qualified_prospects} />
        <StatCard label="À contacter aujourd'hui" value={data.to_contact_today} />
        <StatCard label="Relances planifiées" value={data.follow_ups_count} />
        <StatCard label="Convertis" value={data.converted_prospects} />
        <StatCard label="Taux de conversion" value={`${data.conversion_rate}%`} />
        <StatCard label="Prospects prioritaires" value={data.priority_prospects} accent />
      </div>

      <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-[var(--color-brand-blue)] mb-1">
          🎯 Actions recommandées aujourd'hui
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Générées par le moteur IA à partir du score de chaque prospect.
        </p>
        {data.recommended_actions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune recommandation pour l'instant — lance l'analyse IA ci-dessus.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.recommended_actions.map((action, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg bg-[var(--color-brand-gray)] px-4 py-3 text-sm"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-yellow)] text-[11px] font-bold text-[var(--color-brand-blue)]">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/prospects"
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand-blue)] hover:underline"
        >
          Voir tous les prospects →
        </Link>
      </div>
    </div>
  );
}
