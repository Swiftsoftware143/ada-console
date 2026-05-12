import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Code2, Zap, Settings } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testId: "nav-dashboard" },
  { to: "/clients", label: "Clients", icon: Users, testId: "nav-clients" },
  { to: "/embed", label: "Embed Code", icon: Code2, testId: "nav-embed" },
  { to: "/settings", label: "Settings", icon: Settings, testId: "nav-settings" },
];

export default function Sidebar() {
  return (
    <aside
      data-testid="sidebar"
      className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-[#1a1d27] border-r border-[#2e3245]"
    >
      <div className="px-6 py-7 border-b border-[#2e3245]">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[#007bff] grid place-items-center shadow-[0_0_20px_rgba(0,123,255,0.45)]">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div
              className="font-black text-white tracking-tight text-[15px]"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              SwiftImpact
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#64748b] font-semibold">
              ADA Console
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={item.testId}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#007bff]/12 text-white border border-[#007bff]/30 shadow-[0_0_15px_rgba(0,123,255,0.12)]"
                  : "text-[#94a3b8] hover:text-white hover:bg-[#1e2130] border border-transparent"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-[#2e3245]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#64748b] font-semibold mb-1">
          Agency
        </div>
        <div className="text-sm text-white font-medium">SwiftImpact Solutions</div>
        <div className="text-xs text-[#64748b] mt-0.5">ADA Widget Platform</div>
      </div>
    </aside>
  );
}
