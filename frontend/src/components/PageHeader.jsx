export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#007bff] font-bold mb-2">
            {eyebrow}
          </div>
        )}
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
