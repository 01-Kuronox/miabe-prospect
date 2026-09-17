import { useState } from "react";
import { api } from "../api";

const IMPORT_TYPES = [
  {
    key: "prospects",
    label: "Prospects",
    description: "Liste de vos prospects (entreprise, secteur, contact, besoin...)",
    fn: api.importProspects,
  },
  {
    key: "clients",
    label: "Clients",
    description: "Vos clients déjà convertis (utilisé pour l'historique).",
    fn: api.importClients,
  },
  {
    key: "offers",
    label: "Offres / Services",
    description: "Votre catalogue d'offres — sert au scoring des besoins.",
    fn: api.importOffers,
  },
  {
    key: "sectorStats",
    label: "Statistiques sectorielles",
    description: "Taux de conversion par secteur — sert au scoring des prospects.",
    fn: api.importSectorStats,
  },
];

function ImportCard({ type }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { kind: "success"|"error", message }
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await type.fn(file);
      const count = result?.imported ?? result?.count ?? undefined;
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-[var(--color-brand-blue)]">{type.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
          setStatus(null);
        }}
        className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200"
      />

      <button
        type="button"
        disabled={!file || loading}
        onClick={handleUpload}
        className="self-start rounded-lg bg-[var(--color-brand-blue)] text-white text-xs font-semibold px-4 py-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {loading ? "Import en cours..." : "Importer ce fichier"}
      </button>

      {status && (
        <p
          className={`text-xs rounded-lg px-3 py-2 border ${
            status.kind === "success"
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

export default function Import() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-[var(--color-brand-blue)] mb-1">
        Importer mes données
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Chargez vos propres fichiers CSV. Ils sont rattachés uniquement à votre
        entreprise — aucune autre entreprise ne peut les voir.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {IMPORT_TYPES.map((type) => (
          <ImportCard key={type.key} type={type} />
        ))}
      </div>
    </div>
  );
}
