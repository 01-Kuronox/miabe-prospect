import { useEffect } from "react";
import { X, Headset } from "lucide-react";
import { BRAND } from "../brand";
import { CONTACT } from "../contact";
import ContactChannels from "./ContactChannels";

/**
 * Fenêtre « Nous contacter » de la page de connexion.
 *
 * C'est l'écran que voit une entreprise qui scanne le QR code du flyer :
 * elle n'a pas de compte, elle doit pouvoir nous joindre sans s'inscrire.
 */
export default function ContactModal({ open, onClose }) {
  // Fermeture au clavier (Échap) + on bloque le défilement de la page derrière.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nous contacter"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-brand-blue)]/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-5 flex items-start gap-3">
          <span
            className="icon-chip h-10 w-10 shrink-0"
            style={{
              backgroundColor: "var(--tint-blue-bg)",
              color: "var(--tint-blue-fg)",
            }}
          >
            <Headset size={19} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
              Parlons de votre prospection
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Une démonstration, un devis ou une question sur {BRAND.name} ?
              Choisissez le canal qui vous arrange, on répond vite.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <ContactChannels compact />

        <p className="mt-5 text-center text-[11px] text-slate-400">
          {CONTACT.city} · Réponse sous 24 h ouvrées
        </p>
      </div>
    </div>
  );
}
