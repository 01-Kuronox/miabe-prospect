import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, SlidersHorizontal } from "lucide-react";
import { api } from "../api";
import { StatusBadge, PriorityBadge, ScorePill } from "../components/Badge";
import LoadError from "../components/LoadError";

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
    setError(null);
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

  // Échec du tout premier chargement : la page n'a rien à montrer, on affiche
  // l'écran de secours plutôt qu'un tableau vide surmonté d'un texte rouge.
  if (error && prospects.length === 0) {
    return <LoadError message={error} onRetry={load} />;
  }

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <div className="mb-7 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{ backgroundColor: "var(--tint-blue-bg)", color: "var(--tint-blue-fg)" }}
        >
          <Building2 size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Prospects
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Recherche, filtres et scoring — {prospects.length} résultat(s).
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="mb-6 flex flex-wrap gap-2.5 sm:gap-3">
        {/* basis-full : sur téléphone la recherche occupe sa propre ligne, sinon
            les deux listes déroulantes deviennent trop étroites pour être lues. */}
        <div className="relative min-w-[200px] flex-1 basis-full sm:basis-0">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise, un contact, un email…"
            className="w-full rounded-xl border border-[var(--border-soft)] bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-[var(--color-brand-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/15"
          />
        </div>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--color-brand-blue)]/30 focus:outline-none sm:flex-none sm:px-3.5"
        >
          <option value="">Tous les secteurs</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--color-brand-blue)]/30 focus:outline-none sm:flex-none sm:px-3.5"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-blue-light)] sm:w-auto"
        >
          <SlidersHorizontal size={15} strokeWidth={2.2} />
          Filtrer
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Téléphone : une carte par prospect — un tableau à six colonnes est
          illisible sous 640 px et force un défilement horizontal. */}
      <div className="space-y-2.5 md:hidden">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>
        ) : prospects.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Aucun prospect ne correspond à ces filtres.
          </p>
        ) : (
          prospects.map((p) => (
            <Link
              key={p.id}
              to={`/prospects/${p.id}`}
              className="card block p-4 transition-colors active:bg-[var(--surface-muted)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-brand-blue)]">
                    {p.company_name}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                    {[p.sector, p.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <ScorePill score={p.score} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={p.priority} />
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Ordinateur et tablette : le tableau complet, inchangé. */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Entreprise</th>
              <th className="px-4 py-3 text-left">Secteur</th>
              <th className="px-4 py-3 text-left">Ville</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Priorité</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
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
                <tr key={p.id} className="transition-colors hover:bg-[var(--surface-muted)]">
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
