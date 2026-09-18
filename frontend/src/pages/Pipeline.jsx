import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Workflow } from "lucide-react";
import { api } from "../api";
import LoadError from "../components/LoadError";
import { ScorePill } from "../components/Badge";

export default function Pipeline() {
  const [pipeline, setPipeline] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setPipeline(null);
    api.getPipeline().then(setPipeline).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error) return <LoadError message={error} onRetry={load} />;
  if (!pipeline) return <div className="p-8 text-slate-500">Chargement…</div>;

  return (
    <div className="p-8 lg:p-10">
      <div className="mb-7 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{ backgroundColor: "var(--tint-emerald-bg)", color: "var(--tint-emerald-fg)" }}
        >
          <Workflow size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Pipeline commercial
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Identifier → Qualifier → Prospecter → Relancer → Convertir
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
          <div key={stage} className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[13px] font-semibold tracking-tight text-[var(--color-brand-blue)]">{stage}</h3>
              <span className="rounded-full bg-[var(--color-brand-yellow)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-brand-blue)]">
                {pipeline.counts[stage] || 0}
              </span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {(pipeline.columns[stage] || []).map((p) => (
                <Link
                  to={`/prospects/${p.id}`}
                  key={p.id}
                  className="card block p-3.5 transition-shadow hover:shadow-[0_2px_4px_rgba(11,37,69,0.05),0_12px_28px_-14px_rgba(11,37,69,0.2)]"
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
