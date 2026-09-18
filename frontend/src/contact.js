/**
 * Coordonnées de l'équipe Miabé Prospect.
 *
 * ⚠️ C'est LE seul fichier à modifier pour changer un numéro, une adresse ou
 * ajouter un réseau : la page de connexion et le menu « Contact » de
 * l'application lisent tous les deux cette liste.
 *
 * Pour ajouter LinkedIn plus tard : décommente le bloc tout en bas et colle
 * l'adresse du profil dans « href ». Rien d'autre à toucher.
 */

const PHONE_MAIN = "+22898614646"; // format international, sans espaces — sert aux liens
const PHONE_ALT = "+22871433662";

export const CONTACT = {
  email: "kuronox6@gmail.com",
  phoneMain: PHONE_MAIN,
  phoneAlt: PHONE_ALT,
  whatsapp: PHONE_MAIN,
  facebook: "https://www.facebook.com/djawad.midjiyawa.2025",
  city: "Lomé, Togo",
};

/**
 * Les canaux affichés, dans l'ordre. Chaque entrée porte :
 *  - icon   : nom de l'icône lucide-react (résolu dans ContactChannels)
 *  - tint   : couleur de pastille (variables --tint-*-bg / -fg du thème)
 *  - label  : titre de la carte
 *  - value  : ce que l'utilisateur lit
 *  - href   : ce qui se passe au clic
 */
export const CONTACT_CHANNELS = [
  {
    id: "email",
    icon: "Mail",
    tint: "blue",
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      "Demande d'information — Miabé Prospect"
    )}`,
    action: "Écrire un message",
  },
  {
    id: "whatsapp",
    icon: "MessageCircle",
    tint: "emerald",
    label: "WhatsApp",
    value: "+228 98 61 46 46",
    href: `https://wa.me/${CONTACT.whatsapp.replace("+", "")}?text=${encodeURIComponent(
      "Bonjour, je vous contacte au sujet de Miabé Prospect."
    )}`,
    action: "Discuter maintenant",
    external: true,
  },
  {
    id: "phone",
    icon: "Phone",
    tint: "amber",
    label: "Téléphone",
    value: "+228 98 61 46 46",
    secondValue: "+228 71 43 36 62",
    href: `tel:${CONTACT.phoneMain}`,
    secondHref: `tel:${CONTACT.phoneAlt}`,
    action: "Appeler",
  },
  {
    id: "facebook",
    icon: "Users",
    tint: "sky",
    label: "Facebook",
    value: "Djawad Midjiyawa",
    href: CONTACT.facebook,
    action: "Voir la page",
    external: true,
  },
  // Pour activer LinkedIn, retire les « // » des 9 lignes ci-dessous
  // et remplace l'adresse par la tienne.
  // {
  //   id: "linkedin",
  //   icon: "Briefcase",
  //   tint: "violet",
  //   label: "LinkedIn",
  //   value: "Miabé Prospect",
  //   href: "https://www.linkedin.com/in/...",
  //   action: "Voir le profil",
  //   external: true,
  // },
];
