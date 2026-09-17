export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-black ${
          accent ? "text-[var(--color-brand-blue)]" : "text-slate-800"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
