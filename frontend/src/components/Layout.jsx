import { NavLink, Outlet } from "react-router-dom";
import { BRAND } from "../brand";
import { useAuth } from "../AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/prospects", label: "Prospects", icon: "🏢" },
  { to: "/pipeline", label: "Pipeline", icon: "🧭" },
  { to: "/relances", label: "Relances", icon: "🔔" },
  { to: "/assistant", label: "Assistant IA", icon: "🤖" },
  { to: "/import", label: "Importer mes données", icon: "📥" },
];

export default function Layout() {
  const { company, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-[var(--color-brand-blue)] text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={BRAND.logoIcon} alt={BRAND.name} className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-bold leading-tight">{BRAND.name}</p>
              <p className="text-[11px] text-white/60 leading-tight">
                {BRAND.tagline}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-brand-yellow)] text-[var(--color-brand-blue)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          {company && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-white truncate">{company.name}</p>
              <p className="text-[11px] text-white/50 truncate">
                {company.sector || "Secteur non renseigné"}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full text-left text-[11px] text-white/60 hover:text-white transition-colors"
          >
            ↩ Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[var(--color-brand-gray)] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
