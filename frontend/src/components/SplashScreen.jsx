import { useEffect, useState } from "react";
import { BRAND } from "../brand";

/**
 * Écran d'accueil animé, affiché à chaque ouverture/rafraîchissement de
 * l'application, avant le Dashboard.
 *
 * Le vrai logo (src/brand.js -> BRAND.logoIcon) apparaît en fondu + léger
 * zoom, puis le nom de la marque apparaît juste après. L'utilisateur peut
 * cliquer n'importe où pour passer directement à l'application (utile
 * pendant les tests ou si un membre du jury clique plusieurs fois).
 */
export default function SplashScreen({ onFinish }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Durée totale ~3s : le temps que le contour + la flèche se dessinent,
    // que le nom apparaisse, et qu'on le laisse un instant à l'écran avant
    // de basculer sur le Dashboard.
    const closeTimer = setTimeout(() => setClosing(true), 2600);
    const finishTimer = setTimeout(() => onFinish(), 3100);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setClosing(true);
    setTimeout(onFinish, 300);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-brand-blue)] cursor-pointer transition-opacity duration-500 ${
        closing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img
        src={BRAND.logoIcon}
        alt={BRAND.name}
        className="h-24 w-24 rounded-2xl logo-fade-in"
        style={{ animationDelay: "0s", animationDuration: "0.6s" }}
      />

      <div
        className="mt-6 text-center logo-text-reveal"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="text-white text-2xl font-black tracking-wide">
          {BRAND.name}
        </p>
        <p className="text-white/60 text-xs mt-1">{BRAND.tagline}</p>
      </div>
    </div>
  );
}
