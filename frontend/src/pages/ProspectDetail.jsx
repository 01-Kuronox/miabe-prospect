import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { StatusBadge, PriorityBadge, ScorePill } from "../components/Badge";

const STATUSES = [
  "Nouveau", "Qualifié", "Contacté", "En discussion",
  "À relancer", "Converti", "Refusé", "Non intéressé", "Perdu",
];
const CHANNELS = ["Email", "LinkedIn", "Téléphone", "WhatsApp"];
const TONES = [
  { value: "professionnel", label: "Professionnel" },
  { value: "chaleureux", label: "Chaleureux" },
  { value: "direct", label: "Direct" },
];

export default function ProspectDetail() {
  const { id } = useParams();
  const [prospect, setProspect] = useState(null);
  const [activities, setActivities] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [channel, setChannel] = useState("");
  const [tone, setTone] = useState("professionnel");
  const [followUpDate, setFollowUpDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [qualifying, setQualifying] = useState(false);

  const load = () => {
    api.getProspect(id).then(setProspect).catch((e) => setError(e.message));
    api.listActivities(id).then(setActivities).catch(() => {});
    api.listAnalyses(id).then(setAnalyses).catch(() => {});
  };

  useEffect(load, [id]);

  const handleStatusChange = async (status) => {
    const updated = await api.updateStatus(id, status);
    setProspect(updated);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.analyzeProspect(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateMessage = async () => {
    setGenerating(true);
    setCopied(false);
    try {
      const payload = { tone };
      if (channel) payload.channel = channel;
      const res = await api.generateMessage(id, payload);
      setMessage(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      /* le presse-papier peut être indisponible, tant pis */
    }
  };

  const handleQualify = async () => {
    setQualifying(true);
    try {
      await handleStatusChange("Qualifié");
    } finally {
      setQualifying(false);
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDate) return;
    await api.createFollowUp({
      prospect_id: Number(id),
      date: followUpDate,
      channel: prospect.preferred_channel || "Email",
    });
    setFollowUpDate("");
    load();
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!prospect) return <div className="p-8 text-slate-500">Chargement…</div>;

  const lastAnalysis = analyses[0];
  let reasons = [];
  if (lastAnalysis) {
    try {
      reasons = JSON.parse(lastAnalysis.reasons);
    } catch (_) {
      reasons = [];
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/prospects" className="text-sm text-slate-500 hover:underline">
        ← Retour aux prospects
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-brand-blue)]">
            {prospect.company_name}
          </h1>
          <p className="text-slate-500 text-sm">
            {prospect.sector || "Secteur inconnu"} · {prospect.location || "Ville inconnue"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScorePill score={prospect.score} />
          <PriorityBadge priority={prospect.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Colonne infos */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-[var(--color-brand-blue)] mb-3">Informations</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-slate-500">Contact</dt><dd>{prospect.contact_name || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Fonction</dt><dd>{prospect.contact_role || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="truncate max-w-[150px]">{prospect.email || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Canal préféré</dt><dd>{prospect.preferred_channel || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Besoin</dt><dd>{prospect.need || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Taille</dt><dd>{prospect.size ? `${prospect.size} employés` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Prochaine relance</dt><dd>{prospect.next_follow_up_date || "—"}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-[var(--color-brand-blue)] mb-3">Statut du pipeline</h2>
            <StatusBadge status={prospect.status} />
            <select
              value={prospect.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-[var(--color-brand-blue)] mb-3">Programmer une relance</h2>
            <form onSubmit={handleScheduleFollowUp} className="space-y-2">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--color-brand-blue)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-blue-light)]"
              >
                Planifier
              </button>
            </form>
          </div>
        </div>

        {/* Colonne IA */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[var(--color-brand-blue)]">🧠 Analyse IA</h2>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="rounded-lg bg-[var(--color-brand-yellow)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-yellow-dark)] disabled:opacity-50"
              >
                {analyzing ? "Analyse…" : lastAnalysis ? "Ré-analyser" : "Analyser ce prospect"}
              </button>
            </div>

            {!lastAnalysis ? (
              <p className="text-sm text-slate-500">
                Pas encore d'analyse pour ce prospect. Clique sur "Analyser ce prospect".
              </p>
            ) : (
              <>
                <p className="text-sm mb-3">
                  <span className="font-bold text-2xl mr-2">{Math.round(lastAnalysis.score)}/100</span>
                  <PriorityBadge priority={lastAnalysis.priority} />
                </p>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Raisons</p>
                <ul className="text-sm space-y-1 mb-3 list-disc list-inside text-slate-600">
                  {reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Recommandation</p>
                <p className="text-sm bg-[var(--color-brand-gray)] rounded-lg p-3">
                  {lastAnalysis.recommendation}
                </p>
                {prospect.status === "Nouveau" && (
                  <button
                    onClick={handleQualify}
                    disabled={qualifying}
                    className="mt-3 rounded-lg bg-[var(--color-brand-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-light)] disabled:opacity-50"
                  >
                    {qualifying ? "…" : "✓ Suivre la recommandation : Qualifier ce prospect"}
                  </button>
                )}
                <p className="mt-3 text-[11px] text-slate-400">
                  L'IA calcule le score et explique son raisonnement, mais c'est toi qui décides de qualifier, contacter ou classer un prospect.
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-[var(--color-brand-blue)] mb-3">✉️ Générer un message</h2>
            <p className="text-xs text-slate-400 mb-3">
              L'IA propose un brouillon — relis-le et modifie-le avant de l'envoyer.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                    channel === c
                      ? "bg-[var(--color-brand-blue)] text-white border-[var(--color-brand-blue)]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {c}
                </button>
              ))}
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button
                onClick={handleGenerateMessage}
                disabled={generating}
                className="ml-auto rounded-lg bg-[var(--color-brand-yellow)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-yellow-dark)] disabled:opacity-50"
              >
                {generating ? "Génération…" : message ? "Régénérer" : "Générer"}
              </button>
            </div>
            {message && (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm bg-[var(--color-brand-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-yellow)]"
                />
                <button
                  onClick={handleCopyMessage}
                  className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)]"
                >
                  {copied ? "✓ Copié" : "📋 Copier le message"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-[var(--color-brand-blue)] mb-3">🕓 Historique des interactions</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune interaction enregistrée.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {activities.map((a) => (
                  <li key={a.id} className="py-2 flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-700">{a.action || a.type}</p>
                      <p className="text-slate-500">{a.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-400">{a.date}</p>
                      <p className="text-xs font-semibold text-slate-500">{a.result}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
