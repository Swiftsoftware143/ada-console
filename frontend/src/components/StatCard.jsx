import { DashboardCard } from "./DashboardCard";

export default function StatCard({ label, value, icon: Icon, accentClass = "text-[#007bff]", testId }) {
  return (
    <DashboardCard
      data-testid={testId}
      hover
      padding="normal"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#64748b]">
          {label}
        </div>
        {Icon && (
          <div className={`h-9 w-9 rounded-lg bg-[#0f1117] border border-[#2e3245] grid place-items-center ${accentClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div
        className="text-4xl font-bold text-white tracking-tight"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {value}
      </div>
    </DashboardCard>
  );
}
