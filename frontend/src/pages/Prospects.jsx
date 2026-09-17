import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { StatusBadge, PriorityBadge, ScorePill } from "../components/Badge";

const STATUSES = [
  "Nouveau", "Qualifié", "Contacté", "En discussion",
  "À relancer", "Converti", "Refusé", "Non intéressé", "Perdu",
];

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");
  const [sectors, setSectors] = useState([]);

  const load = () => {
    setLoading(true);
    api
      .listProspects({ search, sector, status, limit: 300 })
      .then((data) => {
        setProspects(data);
        if (sectors.length === 0) {
          const uniq = [...new Set(data.map((p) => p.sector).filter(Boolean))].sort();
          setSectors(uniq);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-black text-[var(--color-brand-blue)] mb-1">Prospects</h1>
      <p className="text-slate-500 text-sm mb-6">
        Recherche, filtres et scoring — {prospects.length} résultat(s).
      </p>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise, un contact, un email…"
          className="flex-1 min-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-yellow)]"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Tous les secteurs</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-brand-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-blue-light)]"
        >
          Filtrer
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-brand-gray)] text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Entreprise</th>
              <th className="px-4 py-3 text-left">Secteur</th>
              <th className="px-4 py-3 text-left">Ville</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Priorité</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Aucun prospect ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              prospects.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--color-brand-gray)]/60">
                  <td className="px-4 py-3">
                    <Link
                      to={`/prospects/${p.id}`}
                      className="font-semibold text-[var(--color-brand-blue)] hover:underline"
                    >
                      {p.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.sector || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.location || "—"}</td>
                  <td className="px-4 py-3"><ScorePill score={p.score} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
