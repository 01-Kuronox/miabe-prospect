import { Headset, Clock, MapPin } from "lucide-react";
import { BRAND } from "../brand";
import { CONTACT } from "../contact";
import ContactChannels from "../components/ContactChannels";

/**
 * Menu « Contact » de l'application — pour les entreprises déjà inscrites
 * qui veulent joindre l'équipe (question, bug, accompagnement).
 */
export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <div className="mb-7 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{
            backgroundColor: "var(--tint-blue-bg)",
            color: "var(--tint-blue-fg)",
          }}
        >
          <Headset size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Contact
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Une question, un besoin d'accompagnement ? L'équipe {BRAND.name} vous
            répond.
          </p>
        </div>
      </div>

      <ContactChannels />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3.5 text-[12.5px] text-slate-500">
        <span className="flex items-center gap-2">
          <MapPin size={15} strokeWidth={2} className="text-slate-400" />
          {CONTACT.city}
        </span>
        <span className="flex items-center gap-2">
          <Clock size={15} strokeWidth={2} className="text-slate-400" />
          Lundi – samedi, 8 h – 19 h · réponse sous 24 h ouvrées
        </span>
      </div>
    </div>
  );
}
