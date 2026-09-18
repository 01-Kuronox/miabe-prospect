import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Brain, Mail, History, Copy, Check, ArrowLeft } from "lucide-react";
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
    <div className="max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link to="/prospects" className="text-sm text-slate-500 hover:underline">
        ← Retour aux prospects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-[var(--color-brand-blue)]">
            {prospect.company_name}
          </h1>
          <p className="text-slate-500 text-sm">
            {prospect.sector || "Secteur inconnu"} · {prospect.location || "Ville inconnue"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ScorePill score={prospect.score} />
          <PriorityBadge priority={prospect.priority} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Colonne infos */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-bold tracking-tight text-[var(--color-brand-blue)]">Informations</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Contact</dt><dd>{prospect.contact_name || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Fonction</dt><dd>{prospect.contact_role || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Email</dt><dd className="truncate">{prospect.email || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Canal préféré</dt><dd>{prospect.preferred_channel || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Besoin</dt><dd>{prospect.need || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Taille</dt><dd>{prospect.size ? `${prospect.size} employés` : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-slate-500">Prochaine relance</dt><dd>{prospect.next_follow_up_date || "—"}</dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-bold tracking-tight text-[var(--color-brand-blue)]">Statut du pipeline</h2>
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

          <div className="card p-5">
            <h2 className="mb-3 font-bold tracking-tight text-[var(--color-brand-blue)]">Programmer une relance</h2>
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
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-bold tracking-tight text-[var(--color-brand-blue)]">
                <Brain size={17} strokeWidth={2.1} className="text-[var(--tint-violet-fg)]" />
                Analyse IA
              </h2>
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
                <p className="text-sm rounded-xl bg-[var(--surface-muted)] p-3">
                  {lastAnalysis.recommendation}
                </p>
                {prospect.status === "Nouveau" && (
                  <button
                    onClick={handleQualify}
                    disabled={qualifying}
                    className="mt-3 rounded-lg bg-[var(--color-brand-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-light)] disabled:opacity-50"
                  >
                    {qualifying ? (
                      "…"
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Check size={14} strokeWidth={2.4} />
                        Suivre la recommandation : qualifier ce prospect
                      </span>
                    )}
                  </button>
                )}
                <p className="mt-3 text-[11px] text-slate-400">
                  L'IA calcule le score et explique son raisonnement, mais c'est toi qui décides de qualifier, contacter ou classer un prospect.
                </p>
              </>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold tracking-tight text-[var(--color-brand-blue)]">
              <Mail size={17} strokeWidth={2.1} className="text-[var(--tint-sky-fg)]" />
              Générer un message
            </h2>
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
                  <span className="inline-flex items-center gap-1.5">
                    {copied ? <Check size={14} strokeWidth={2.4} /> : <Copy size={14} strokeWidth={2.2} />}
                    {copied ? "Copié" : "Copier le message"}
                  </span>
                </button>
              </>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold tracking-tight text-[var(--color-brand-blue)]">
              <History size={17} strokeWidth={2.1} className="text-slate-400" />
              Historique des interactions
            </h2>
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
