import React from 'react';
import MasterToggle from "./MasterToggle";
import { MasterStatusHeroProps } from '@/types';

const MasterStatusHero: React.FC<MasterStatusHeroProps> = ({ name, domain, active, onToggle }) => {
  return (
    <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-6 md:p-7 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#007bff] font-bold mb-2">
            Widget Status
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {name}
          </h1>
          <div className="mt-1.5 text-sm text-[#94a3b8] font-mono">{domain}</div>
        </div>

        <div className="flex items-center gap-5 bg-[#0f1117] border border-[#2e3245] rounded-xl px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#64748b] font-bold">
              Master Switch
            </div>
            <div
              data-testid="widget-status-label"
              className={`text-lg font-bold tracking-tight ${
                active ? "text-[#10b981]" : "text-[#ef4444]"
              }`}
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {active ? "Active" : "Inactive"}
            </div>
          </div>
          <MasterToggle active={active} onChange={onToggle} testId="master-widget-toggle" />
        </div>
      </div>
    </div>
  );
};

export default MasterStatusHero;
