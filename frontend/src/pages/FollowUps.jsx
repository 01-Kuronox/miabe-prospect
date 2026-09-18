import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { api } from "../api";
import LoadError from "../components/LoadError";

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [prospectNames, setProspectNames] = useState({});
  const [error, setError] = useState(null);

  const load = () => {
    api
      .listFollowUps()
      .then(async (data) => {
        setFollowUps(data);
        const ids = [...new Set(data.map((f) => f.prospect_id))];
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const p = await api.getProspect(id);
              return [id, p.company_name];
            } catch {
              return [id, `Prospect #${id}`];
            }
          })
        );
        setProspectNames(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const markDone = async (id) => {
    await api.updateFollowUpStatus(id, "faite");
    load();
  };

  if (error) return <LoadError message={error} onRetry={load} />;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-10">
      <div className="mb-7 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{ backgroundColor: "var(--tint-amber-bg)", color: "var(--tint-amber-fg)" }}
        >
          <BellRing size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Relances
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Relances passées, actuelles et futures.
          </p>
        </div>
      </div>

      {followUps.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucune relance programmée. Va sur une fiche prospect pour en planifier une.
        </p>
      ) : (
        <ul className="space-y-2">
          {followUps.map((f) => (
            <li
              key={f.id}
              className={`flex items-center justify-between rounded-xl border p-4 shadow-sm ${
                f.status === "faite"
                  ? "bg-slate-50 border-slate-100 opacity-60"
                  : f.date === today
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-slate-100"
              }`}
            >
              <div>
                <Link
                  to={`/prospects/${f.prospect_id}`}
                  className="font-semibold text-[var(--color-brand-blue)] hover:underline"
                >
                  {prospectNames[f.prospect_id] || `Prospect #${f.prospect_id}`}
                </Link>
                <p className="text-sm text-slate-500">
                  {f.date} · {f.channel || "canal non précisé"}
                  {f.notes ? ` · ${f.notes}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {f.status}
                </span>
                {f.status !== "faite" && (
                  <button
                    onClick={() => markDone(f.id)}
                    className="rounded-lg bg-[var(--color-brand-yellow)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-yellow-dark)]"
                  >
                    Marquer faite
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
