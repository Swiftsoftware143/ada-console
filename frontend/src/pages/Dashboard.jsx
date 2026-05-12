import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, CheckCircle2, XCircle, Sparkles, Plus, ArrowRight, Inbox } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, isThisMonth } from "@/lib/helpers";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import ClientFormModal from "@/components/ClientFormModal";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.active).length;
    const inactive = total - active;
    const thisMonth = clients.filter((c) => isThisMonth(c.created_at)).length;
    return { total, active, inactive, thisMonth };
  }, [clients]);

  const recent = clients.slice(0, 5);

  const renderRecent = () => {
    if (loading) {
      return <div className="p-10 text-center text-[#64748b] text-sm">Loading clients...</div>;
    }
    if (recent.length === 0) {
      return <EmptyState onAdd={() => setModalOpen(true)} />;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="recent-clients-table">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#64748b] font-bold">
              <th className="px-6 py-3 font-bold">Client</th>
              <th className="px-6 py-3 font-bold">Domain</th>
              <th className="px-6 py-3 font-bold">Plan</th>
              <th className="px-6 py-3 font-bold">Status</th>
              <th className="px-6 py-3 font-bold">Added</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                data-testid={`recent-client-row-${c.id}`}
                className="border-t border-[#2e3245] hover:bg-[#1a1d27]/60 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                <td className="px-6 py-4 text-[#94a3b8] font-mono text-xs">{c.domain}</td>
                <td className="px-6 py-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">
                    {c.plan_tier}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge active={c.active} testId={`recent-status-${c.id}`} />
                </td>
                <td className="px-6 py-4 text-[#94a3b8] text-xs">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Real-time view of every ADA widget you manage across your client portfolio."
        actions={
          <Button
            data-testid="dashboard-quick-add-btn"
            onClick={() => setModalOpen(true)}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)] hover:shadow-[0_0_22px_rgba(0,123,255,0.45)] transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick add client
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          label="Total Clients"
          value={loading ? "—" : stats.total}
          icon={Users}
          accentClass="text-[#007bff]"
          testId="stat-total-clients"
        />
        <StatCard
          label="Active Widgets"
          value={loading ? "—" : stats.active}
          icon={CheckCircle2}
          accentClass="text-[#10b981]"
          testId="stat-active-widgets"
        />
        <StatCard
          label="Inactive Widgets"
          value={loading ? "—" : stats.inactive}
          icon={XCircle}
          accentClass="text-[#ef4444]"
          testId="stat-inactive-widgets"
        />
        <StatCard
          label="New This Month"
          value={loading ? "—" : stats.thisMonth}
          icon={Sparkles}
          accentClass="text-[#a78bfa]"
          testId="stat-new-this-month"
        />
      </div>

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#2e3245]">
          <div>
            <h2
              className="text-lg font-semibold text-white tracking-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Recent clients
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">The five most recently added accounts</p>
          </div>
          <Link
            to="/clients"
            data-testid="view-all-clients-link"
            className="text-xs text-[#007bff] font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {renderRecent()}
      </div>

      <ClientFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={() => load()}
      />
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="p-12 text-center" data-testid="dashboard-empty-state">
      <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3 className="text-white font-semibold tracking-tight text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>
        No clients yet
      </h3>
      <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">Add your first client to start managing ADA widgets.</p>
      <Button
        onClick={onAdd}
        data-testid="empty-state-add-btn"
        className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add your first client
      </Button>
    </div>
  );
}
