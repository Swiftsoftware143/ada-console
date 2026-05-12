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
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, sortByKey } from "@/lib/helpers";
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
  { key: "plan_tier", label: "Plan" },
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
    // Load clients where type = 'personal' OR client_type = 'personal'
    // Using a tag in metadata to identify personal websites
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error(error.message);
    } else {
      // Filter to only show personal websites (those with is_personal = true)
      const personal = (data || []).filter(c => c.is_personal === true);
      setWebsites(personal);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (website, e) => {
    e.stopPropagation();
    const newVal = !website.active;
    const { error } = await supabase
      .from("clients")
      .update({ active: newVal })
      .eq("id", website.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(newVal ? "Widget activated" : "Widget deactivated");
      load();
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("clients").delete().eq("id", toDelete.id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Website deleted");
      load();
    }
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

  const filtered = useMemo(() => {
    let data = [...websites];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (w) =>
          w.name?.toLowerCase().includes(q) ||
          w.domain?.toLowerCase().includes(q)
      );
    }
    return sortByKey(data, sortKey, sortDir);
  }, [websites, search, sortKey, sortDir]);

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-[#64748b]" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-[#007bff]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-[#007bff]" />
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="My Websites"
        title="Personal Websites"
        subtitle="Manage ADA widgets for your own websites."
        actions={
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Website
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
          <Input
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#1e2130] border-[#2e3245] text-white placeholder:text-[#64748b]"
          />
        </div>
      </div>

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#64748b]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 font-bold cursor-pointer select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <SortIcon column={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-10 text-center text-[#64748b]">
                    Loading websites...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1}>
                    <EmptyState onAdd={() => setAddOpen(true)} />
                  </td>
                </tr>
              ) : (
                filtered.map((website) => (
                  <tr
                    key={website.id}
                    onClick={() => navigate(`/clients/${website.id}`)}
                    className="border-t border-[#2e3245] hover:bg-[#1a1d27]/60 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#007bff]/20 grid place-items-center">
                          <Globe className="h-4 w-4 text-[#007bff]" />
                        </div>
                        <span className="text-white font-medium">{website.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#94a3b8] font-mono text-xs">{website.domain}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">
                        {website.plan_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge active={website.active} />
                    </td>
                    <td className="px-6 py-4 text-[#94a3b8] text-xs">
                      {formatDate(website.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${website.id}`);
                          }}
                          className="h-8 w-8 text-[#94a3b8] hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => toggleActive(website, e)}
                          className={`h-8 w-8 ${website.active ? "text-[#10b981]" : "text-[#64748b]"} hover:text-white`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setToDelete(website);
                          }}
                          className="h-8 w-8 text-[#ef4444] hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => load()}
        isPersonal={true}
      />

      <DeleteConfirmModal
        open={!!toDelete}
        onOpenChange={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Website"
        description={`Are you sure you want to delete "${toDelete?.name}"? This will remove the ADA widget from your website.`}
      />
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="p-12 text-center">
      <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
        <Globe className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3 className="text-white font-semibold tracking-tight text-lg">No personal websites yet</h3>
      <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">Add your first website to get an ADA widget.</p>
      <Button onClick={onAdd} className="bg-[#007bff] hover:bg-[#0056b3] text-white">
        <Plus className="h-4 w-4 mr-2" /> Add Website
      </Button>
    </div>
  );
}
