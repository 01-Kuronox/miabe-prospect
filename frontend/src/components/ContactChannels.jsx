import {
  Mail,
  MessageCircle,
  Phone,
  Users,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { CONTACT_CHANNELS } from "../contact";

// La librairie d'icônes ne fournit plus de logos de marques : on utilise des
// icônes neutres, le nom du réseau étant écrit juste à côté.
const ICONS = { Mail, MessageCircle, Phone, Users, Briefcase };

const CARD =
  "flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white p-3.5 h-full";
const CARD_LINK =
  " transition-all hover:-translate-y-0.5 hover:border-[var(--color-brand-blue)]/20 hover:shadow-[0_10px_24px_-14px_rgba(11,37,69,0.45)]";

function Chip({ tint, Icon }) {
  return (
    <span
      className="icon-chip h-10 w-10 shrink-0"
      style={{
        backgroundColor: `var(--tint-${tint}-bg)`,
        color: `var(--tint-${tint}-fg)`,
      }}
    >
      <Icon size={19} strokeWidth={2.1} />
    </span>
  );
}

/**
 * Liste des moyens de nous joindre, sous forme de cartes cliquables.
 *
 * Le même composant sert à deux endroits : la fenêtre de contact de la page
 * de connexion (visiteur qui scanne le flyer) et le menu « Contact » de
 * l'application. Les coordonnées viennent toutes de src/contact.js.
 */
export default function ContactChannels({ compact = false }) {
  return (
    <ul className={compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2"}>
      {CONTACT_CHANNELS.map((c) => {
        const Icon = ICONS[c.icon] || Mail;
        const linkProps = c.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {};

        // Cas du téléphone : deux numéros, donc deux liens — on ne peut pas
        // imbriquer un lien dans un lien, la carte devient un simple bloc.
        if (c.secondHref) {
          return (
            <li key={c.id}>
              <div className={CARD}>
                <Chip tint={c.tint} Icon={Icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--color-brand-blue)]">
                    {c.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <a
                      href={c.href}
                      className="text-[12.5px] text-slate-500 underline-offset-4 hover:text-[var(--color-brand-blue)] hover:underline"
                    >
                      {c.value}
                    </a>
                    <span className="text-[12.5px] text-slate-300">·</span>
                    <a
                      href={c.secondHref}
                      className="text-[12.5px] text-slate-500 underline-offset-4 hover:text-[var(--color-brand-blue)] hover:underline"
                    >
                      {c.secondValue}
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        }

        return (
          <li key={c.id}>
            <a href={c.href} {...linkProps} className={`group ${CARD}${CARD_LINK}`}>
              <Chip tint={c.tint} Icon={Icon} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[var(--color-brand-blue)]">
                  {c.label}
                </p>
                <p className="truncate text-[12.5px] text-slate-500">{c.value}</p>
              </div>
              <ArrowUpRight
                size={16}
                strokeWidth={2.2}
                className="shrink-0 text-slate-300 transition-colors group-hover:text-[var(--color-brand-blue)]"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
