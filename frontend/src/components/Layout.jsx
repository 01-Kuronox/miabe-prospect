import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Workflow,
  BellRing,
  Sparkles,
  Upload,
  Headset,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BRAND } from "../brand";
import { useAuth } from "../AuthContext";

const navItems = [
  { to: "/", label: "Tableau de bord", Icon: LayoutDashboard, end: true },
  { to: "/prospects", label: "Prospects", Icon: Building2 },
  { to: "/pipeline", label: "Pipeline", Icon: Workflow },
  { to: "/relances", label: "Relances", Icon: BellRing },
  { to: "/assistant", label: "Assistant IA", Icon: Sparkles },
  { to: "/import", label: "Mes données", Icon: Upload },
  { to: "/contact", label: "Contact", Icon: Headset },
];

export default function Layout() {
  const { company, logout } = useAuth();
  const location = useLocation();

  // Sur téléphone, le menu est un tiroir qui se referme dès qu'on a choisi
  // une page. Sur grand écran il est toujours visible et cet état est ignoré.
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const initials = (company?.name || BRAND.name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Voile sombre derrière le tiroir (téléphone uniquement) */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[var(--color-brand-blue)]/50 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        // « invisible » en plus du décalage : sans ça, le tiroir fermé reste
        // atteignable au clavier et lu par les lecteurs d'écran alors qu'il est
        // hors de l'écran. La visibilité change à la fin de l'animation quand on
        // ferme, et immédiatement quand on ouvre — le glissement reste fluide.
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] shrink-0 flex-col bg-[var(--color-brand-blue)] text-white transition-[transform,visibility] duration-300 ease-out lg:visible lg:static lg:translate-x-0 ${
          menuOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        {/* Marque */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logoIcon}
              alt={BRAND.name}
              className="h-10 w-10 rounded-xl shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight tracking-tight">{BRAND.name}</p>
              <p className="text-[11px] leading-tight text-white/50">{BRAND.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="-mr-1 shrink-0 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      isActive ? "bg-[var(--color-brand-yellow)]" : "bg-transparent"
                    }`}
                  />
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={isActive ? "text-[var(--color-brand-yellow)]" : ""}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Compte entreprise */}
        <div className="m-3 rounded-xl bg-white/[0.06] p-3">
          {company && (
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-yellow)] text-xs font-bold text-[var(--color-brand-blue)]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{company.name}</p>
                <p className="truncate text-[11px] text-white/45">
                  {company.sector || "Secteur non renseigné"}
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={14} strokeWidth={2} />
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut (téléphone et tablette uniquement) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--border-soft)] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="-ml-1 rounded-lg p-1.5 text-[var(--color-brand-blue)] transition-colors hover:bg-slate-100"
          >
            <Menu size={22} strokeWidth={2.1} />
          </button>
          <img src={BRAND.logoIcon} alt="" className="h-8 w-8 rounded-lg" />
          <p className="truncate text-[15px] font-bold text-[var(--color-brand-blue)]">
            {BRAND.name}
          </p>
        </header>

        <main className="app-surface min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
