export default function StatCard({ label, value, sub, Icon, tint = "blue", accent = false }) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-[0_2px_4px_rgba(11,37,69,0.05),0_12px_28px_-14px_rgba(11,37,69,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {Icon && (
          <span
            className="icon-chip h-9 w-9"
            style={{
              backgroundColor: `var(--tint-${tint}-bg)`,
              color: `var(--tint-${tint}-fg)`,
            }}
          >
            <Icon size={17} strokeWidth={2.1} />
          </span>
        )}
      </div>
      <p
        className={`mt-2 text-[28px] font-extrabold tracking-tight ${
          accent ? "text-[var(--color-brand-blue)]" : "text-slate-800"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
