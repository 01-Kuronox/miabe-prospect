const STATUS_STYLES = {
  "Nouveau": "bg-slate-100 text-slate-700",
  "Qualifié": "bg-sky-100 text-sky-700",
  "Contacté": "bg-indigo-100 text-indigo-700",
  "En discussion": "bg-amber-100 text-amber-700",
  "À relancer": "bg-orange-100 text-orange-700",
  "Converti": "bg-emerald-100 text-emerald-700",
  "Refusé": "bg-red-100 text-red-700",
  "Non intéressé": "bg-red-100 text-red-700",
  "Perdu": "bg-red-100 text-red-700",
};

const PRIORITY_STYLES = {
  "Très élevée": "bg-red-100 text-red-700",
  "Élevée": "bg-orange-100 text-orange-700",
  "Moyenne": "bg-amber-100 text-amber-700",
  "Faible": "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status || "—"}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) {
    return (
      <span className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-500">
        Non scoré
      </span>
    );
  }
  const style = PRIORITY_STYLES[priority] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {priority}
    </span>
  );
}

export function ScorePill({ score }) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  let color = "text-slate-600";
  if (score >= 80) color = "text-emerald-600";
  else if (score >= 60) color = "text-amber-600";
  else if (score >= 40) color = "text-orange-600";
  else color = "text-red-600";

  return <span className={`font-bold ${color}`}>{Math.round(score)}</span>;
}
