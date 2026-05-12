export default function StatusBadge({ active, testId = "status-badge" }) {
  return (
    <span
      data-testid={testId}
      data-status={active ? "active" : "inactive"}
      className={
        active
          ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25"
          : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/25"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[#10b981] shadow-[0_0_6px_#10b981]" : "bg-[#ef4444] shadow-[0_0_6px_#ef4444]"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
