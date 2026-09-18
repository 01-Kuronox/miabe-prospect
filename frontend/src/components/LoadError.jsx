import { RefreshCw, CloudOff } from "lucide-react";

/**
 * Écran affiché quand une page n'a pas réussi à charger ses données.
 *
 * Remplace l'ancien message d'erreur brut (« Failed to fetch » en rouge), qui
 * ne proposait rien et obligeait à recharger tout le site à la main. Ici on
 * explique la cause la plus probable — le serveur gratuit qui se réveille —
 * et on offre un bouton pour réessayer sans perdre sa navigation.
 */
export default function LoadError({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-lg p-8 lg:p-10">
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <span
            className="icon-chip h-10 w-10"
            style={{
              backgroundColor: "var(--tint-amber-bg)",
              color: "var(--tint-amber-fg)",
            }}
          >
            <CloudOff size={19} strokeWidth={2.1} />
          </span>
          <div>
            <h2 className="font-bold tracking-tight text-[var(--color-brand-blue)]">
              Données non chargées
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {message || "Le serveur n'a pas répondu."}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Sur l'hébergement gratuit, le serveur se met en veille après un
              moment sans visite et demande environ une minute pour redémarrer.
              C'est la cause la plus fréquente.
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-blue-light)]"
          >
            <RefreshCw size={15} strokeWidth={2.2} />
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}
