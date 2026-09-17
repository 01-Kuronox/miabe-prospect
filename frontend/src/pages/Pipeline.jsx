import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ScorePill } from "../components/Badge";

export default function Pipeline() {
  const [pipeline, setPipeline] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPipeline().then(setPipeline).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!pipeline) return <div className="p-8 text-slate-500">Chargement…</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-[var(--color-brand-blue)] mb-1">
        Pipeline commercial
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Identifier → Qualifier → Prospecter → Relancer → Convertir
      </p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
          <div key={stage} className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-bold text-sm text-[var(--color-brand-blue)]">{stage}</h3>
              <span className="rounded-full bg-[var(--color-brand-yellow)] text-[var(--color-brand-blue)] text-xs font-bold px-2 py-0.5">
                {pipeline.counts[stage] || 0}
              </span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {(pipeline.columns[stage] || []).map((p) => (
                <Link
                  to={`/prospects/${p.id}`}
                  key={p.id}
                  className="block rounded-lg bg-white border border-slate-100 shadow-sm p-3 hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.company_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{p.sector || "—"}</span>
                    <ScorePill score={p.score} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
