import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Power,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, sortByKey, filterClients } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import ClientFormModal from "@/components/ClientFormModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { toast } from "sonner";

const COLUMNS = [
  { key: "name", label: "Website Name" },
  { key: "domain", label: "Domain" },
  { key: "plan_tier", label: "Plan Tier" },
  { key: "active", label: "Status" },
  { key: "created_at", label: "Date Added" },
];

export default function PersonalWebsites() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("personal_websites")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setWebsites(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (website, e) => {
    e.stopPropagation();
    const newVal = !website.active;
    const { error } = await supabase
      .from("personal_websites")
      .update({ active: newVal })
      .eq("id", website.id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`${website.name} ${newVal ? "activated" : "deactivated"}`);
    setWebsites((prev) =>
      prev.map((c) => (c.id === website.id ? { ...c, active: newVal } : c))
    );
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("personal_websites").delete().eq("id", toDelete.id);
    if (error) {
      toast.error("Failed to delete client");
      return;
    }
    toast.success(`${toDelete.name} deleted`);
    setWebsites((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(
    () => sortByKey(websites.filter(w => (w.name?.toLowerCase() || "").includes(search.toLowerCase()) || (w.domain?.toLowerCase() || "").includes(search.toLowerCase())), sortKey, sortDir),
    [websites, search, sortKey, sortDir]
  );

  const renderTable = () => {
    if (loading) {
      return <div className="p-10 text-center text-[#64748b] text-sm">Loading...</div>;
    }
    if (websites.length === 0) {
      return <EmptyState onAdd={() => setAddOpen(true)} />;
    }
    if (filteredSorted.length === 0) {
      return (
        <div className="p-10 text-center text-[#64748b] text-sm" data-testid="no-results">
          No clients match &ldquo;{search}&rdquo;
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="websites-table">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#64748b]">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-6 py-3 font-bold">
                  <button
                    onClick={() => handleSort(col.key)}
                    data-testid={`sort-${col.key}`}
                    className="inline-flex items-center gap-1 hover:text-white transition-colors uppercase tracking-[0.15em] font-bold"
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </button>
                </th>
              ))}
              <th className="px-6 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSorted.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                data-testid={`client-row-${c.id}`}
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
                  <StatusBadge active={c.active} testId={`status-${c.id}`} />
                </td>
                <td className="px-6 py-4 text-[#94a3b8] text-xs">{formatDate(c.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn
                      title="Edit"
                      testId={`edit-btn-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${c.id}`);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title={c.active ? "Deactivate" : "Activate"}
                      testId={`toggle-btn-${c.id}`}
                      onClick={(e) => toggleActive(c, e)}
                      colorClass={
                        c.active
                          ? "hover:text-[#ef4444] hover:border-[#ef4444]/40"
                          : "hover:text-[#10b981] hover:border-[#10b981]/40"
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      testId={`delete-btn-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(c);
                      }}
                      colorClass="hover:text-[#ef4444] hover:border-[#ef4444]/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div data-testid="personal-websites-page">
      <PageHeader
        eyebrow="My Websites"
        title="Personal Websites"
        subtitle="Manage ADA widgets for your own websites."
        actions={
          <Button
            data-testid="add-website-btn"
            onClick={() => setAddOpen(true)}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)] hover:shadow-[0_0_22px_rgba(0,123,255,0.45)] transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Website
          </Button>
        }
      />

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl">
        <div className="px-6 py-4 border-b border-[#2e3245] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
            <Input
              data-testid="websites-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search websites..."
              className="pl-9 bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
            />
          </div>
          <div className="text-xs text-[#64748b]" data-testid="websites-count">
            {filteredSorted.length} {filteredSorted.length === 1 ? "website" : "websites"}
          </div>
        </div>

        {renderTable()}
      </div>

      <ClientFormModal isPersonal open={addOpen} onOpenChange={setAddOpen} onCreated={() => load()} />
      <DeleteConfirmModal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
        clientName={toDelete?.name}
      />
    </div>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-60" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function IconBtn({ children, onClick, title, testId, colorClass = "hover:text-white hover:border-[#3e445e]" }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#2e3245] bg-[#0f1117] text-[#94a3b8] transition-colors ${colorClass}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="p-14 text-center" data-testid="websites-empty-state">
      <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3
        className="text-white font-semibold tracking-tight text-lg"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        No personal websites yet
      </h3>
      <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">
        Add your first website to get an ADA widget.
      </p>
      <Button
        onClick={onAdd}
        data-testid="empty-add-btn"
        className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add your first website
      </Button>
    </div>
  );
}

