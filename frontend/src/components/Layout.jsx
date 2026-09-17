import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Workflow,
  BellRing,
  Sparkles,
  Upload,
  LogOut,
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
];

export default function Layout() {
  const { company, logout } = useAuth();

  const initials = (company?.name || BRAND.name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="w-[264px] shrink-0 bg-[var(--color-brand-blue)] text-white flex flex-col">
        {/* Marque */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logoIcon}
              alt={BRAND.name}
              className="h-10 w-10 rounded-xl shadow-sm"
            />
            <div className="min-w-0">
              <p className="font-bold leading-tight tracking-tight">{BRAND.name}</p>
              <p className="text-[11px] text-white/50 leading-tight">{BRAND.tagline}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
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
            <div className="flex items-center gap-3 mb-3">
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

      <main className="app-surface flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
