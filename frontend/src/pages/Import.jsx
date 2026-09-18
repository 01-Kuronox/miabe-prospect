import { useState } from "react";
import {
  Users,
  UserCheck,
  Package,
  BarChart3,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api";

const IMPORT_TYPES = [
  {
    key: "prospects",
    label: "Prospects",
    description: "Vos prospects : entreprise, secteur, contact, besoin…",
    Icon: Users,
    tint: "blue",
    fn: api.importProspects,
  },
  {
    key: "clients",
    label: "Clients",
    description: "Vos clients déjà convertis, utilisés pour l'historique.",
    Icon: UserCheck,
    tint: "emerald",
    fn: api.importClients,
  },
  {
    key: "offers",
    label: "Offres et services",
    description: "Votre catalogue — sert au scoring des besoins détectés.",
    Icon: Package,
    tint: "violet",
    fn: api.importOffers,
  },
  {
    key: "sectorStats",
    label: "Statistiques sectorielles",
    description: "Taux de conversion par secteur — affine le score IA.",
    Icon: BarChart3,
    tint: "amber",
    fn: api.importSectorStats,
  },
];

function ImportCard({ type }) {
  const { Icon, tint } = type;
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await type.fn(file);
      const count = result?.imported ?? result?.count;
      setStatus({
        kind: "success",
        message:
          count !== undefined
            ? `Import réussi : ${count} ligne(s) ajoutée(s).`
            : "Import réussi.",
      });
      setFile(null);
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Échec de l'import." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{
            backgroundColor: `var(--tint-${tint}-bg)`,
            color: `var(--tint-${tint}-fg)`,
          }}
        >
          <Icon size={19} strokeWidth={2.1} />
        </span>
        <div>
          <p className="font-semibold tracking-tight text-[var(--color-brand-blue)]">
            {type.label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {type.description}
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 transition-colors hover:border-[var(--color-brand-blue)]/30">
        <FileSpreadsheet size={17} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
          {file ? file.name : "Choisir un fichier CSV…"}
        </span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setStatus(null);
          }}
        />
      </label>

      <button
        type="button"
        disabled={!file || loading}
        onClick={handleUpload}
        className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-brand-blue-light)] disabled:opacity-35"
      >
        <Upload size={14} strokeWidth={2.2} />
        {loading ? "Import en cours…" : "Importer ce fichier"}
      </button>

      {status && (
        <p
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
            status.kind === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {status.kind === "success" ? (
            <CheckCircle2 size={14} className="mt-px shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-px shrink-0" />
          )}
          {status.message}
        </p>
      )}
    </div>
  );
}

export default function Import() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-10">
      <div className="mb-8 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{
            backgroundColor: "var(--tint-sky-bg)",
            color: "var(--tint-sky-fg)",
          }}
        >
          <Upload size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Importer mes données
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <ShieldCheck size={15} className="text-emerald-600" />
            Vos fichiers sont rattachés à votre entreprise uniquement.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {IMPORT_TYPES.map((type) => (
          <ImportCard key={type.key} type={type} />
        ))}
      </div>
    </div>
  );
}
