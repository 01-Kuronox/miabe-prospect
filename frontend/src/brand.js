import logoIcon from "./assets/logo-icon.png";

/**
 * Configuration centrale de l'identité de marque.
 *
 * ⚠️ Pour changer le logo plus tard, il suffit de remplacer le fichier
 * src/assets/logo-icon.png (même nom) — aucun autre fichier n'a besoin
 * d'être touché (Layout, Login, SplashScreen, etc. lisent tous ce fichier).
 */
export const BRAND = {
  name: "Miabé Prospect",
  tagline: "Prospection intelligente",
  initial: "M", // repli textuel si jamais l'image ne charge pas
  logoIcon, // icône carrée (badge M jaune/bleu marine)
};
