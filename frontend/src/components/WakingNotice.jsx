import { useEffect, useState } from "react";
import { Loader2, Server } from "lucide-react";

/**
 * Message affiché quand une requête met anormalement longtemps.
 *
 * L'hébergement gratuit met l'API en veille après 15 minutes sans visite.
 * Le premier appel la réveille, ce qui prend jusqu'à une minute. Sans
 * explication, l'utilisateur croit que le site est cassé — d'où ce message,
 * qui n'apparaît qu'au bout de `delay` millisecondes.
 */
export default function WakingNotice({ delay = 2500, compact = false }) {
  const [visible, setVisible] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), delay);
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearTimeout(show);
      clearInterval(tick);
    };
  }, [delay]);

  if (!visible) return null;

  // Barre de progression indicative : le réveil dure environ 50 secondes.
  const progress = Math.min(96, Math.round(((seconds - delay / 1000) / 50) * 100));

  if (compact) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Réveil du serveur en cours… (jusqu'à une minute)
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-start gap-3">
        <span
          className="icon-chip h-9 w-9"
          style={{
            backgroundColor: "var(--tint-amber-bg)",
            color: "var(--tint-amber-fg)",
          }}
        >
          <Server size={17} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--color-brand-blue)]">
            Réveil du serveur en cours…
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Le serveur se met en veille après une période d'inactivité. Il redémarre,
            cela prend généralement moins d'une minute. Les pages suivantes seront
            instantanées.
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--color-brand-yellow)] transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
