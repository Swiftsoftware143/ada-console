import { useCallback, useEffect, useMemo, useState, MouseEvent } from "react";
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
  Tag,
  MapPin,
  Filter,
  X,
  Activity,
  LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, sortByKey } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import ClientFormModal from "@/components/ClientFormModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  domain: string;
  tags?: string | string[];
  location?: string;
  plan_tier: string;
  active: boolean;
  created_at: string;
}

interface Column {
  key: keyof Client | string;
  label: string;
}

const COLUMNS: Column[] = [
  { key: "name", label: "Client Name" },
  { key: "domain", label: "Domain" },
  { key: "tags", label: "Tags" },
  { key: "location", label: "Location" },
  { key: "plan_tier", label: "Plan Tier" },
  { key: "active", label: "Status" },
  { key: "created_at", label: "Date Added" },
];

export default function Clients(): JSX.Element {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  
  const navigate = useNavigate();

  const loadFilters = useCallback(async (): Promise<void> => {
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "tags")
      .maybeSingle();
    
    const allTags = new Set<string>();
    
    if (settingsData?.value) {
      const parsed = typeof settingsData.value === 'string'
        ? settingsData.value.split(',').map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(settingsData.value) ? settingsData.value : [];
      parsed.forEach((t: string) => allTags.add(t));
    }
    
    const [{ data: clientsData }, { data: websitesData }] = await Promise.all([
      supabase.from("clients").select("tags,location"),
      supabase.from("personal_websites").select("tags,location"),
    ]);
    
    const allLocs = new Set<string>();
    [...(clientsData || []), ...(websitesData || [])].forEach((item: { tags?: string | string[]; location?: string }) => {
      if (item.tags) {
        if (typeof item.tags === 'string') {
          item.tags.split(',').forEach((t: string) => allTags.add(t.trim()));
        } else if (Array.isArray(item.tags)) {
          item.tags.forEach((t: string) => allTags.add(t));
        }
      }
      if (item.location) allLocs.add(item.location);
    });
    
    const finalTags = Array.from(allTags).sort();
    
    if (finalTags.length === 0) {
      setAvailableTags(["Medical", "Local Business", "E-commerce", "Professional Services", "Non-Profit", "Enterprise", "Basic Plan", "Pro Plan"]);
    } else {
      setAvailableTags(finalTags);
    }
    setLocations(Array.from(allLocs).sort());
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setClients(data || []);
    }
    setLoading(false);
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (client: Client, e: MouseEvent): Promise<void> => {
    e.stopPropagation();
    const newVal = !client.active;
    const { error } = await supabase
      .from("clients")
      .update({ active: newVal })
      .eq("id", client.id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`${client.name} ${newVal ? "activated" : "deactivated"}`);
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, active: newVal } : c))
    );
  };

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    const { error } = await supabase.from("clients").delete().eq("id", toDelete.id);
    if (error) {
      toast.error("Failed to delete client");
      return;
    }
    toast.success(`${toDelete.name} deleted`);
    setClients((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    loadFilters();
  };

  const handleSort = (key: string): void => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.domain?.toLowerCase().includes(search.toLowerCase()) ||
        c.plan_tier?.toLowerCase().includes(search.toLowerCase()) ||
        (typeof c.tags === 'string' && c.tags.toLowerCase().includes(search.toLowerCase())) ||
        c.location?.toLowerCase().includes(search.toLowerCase());
      
      const clientTags = c.tags ? (typeof c.tags === 'string' ? c.tags.split(',').map((t: string) => t.trim()) : c.tags) : [];
      const matchesTag = tagFilter === "all" || clientTags.includes(tagFilter);
      const matchesLocation = locationFilter === "all" || c.location === locationFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && c.active) || 
        (statusFilter === "inactive" && !c.active);
      
      return matchesSearch && matchesTag && matchesLocation && matchesStatus;
    });
  }, [clients, search, tagFilter, locationFilter, statusFilter]);

  const filteredSorted = useMemo(
    () => sortByKey(filteredClients, sortKey, sortDir),
    [filteredClients, sortKey, sortDir]
  );

  const clearFilters = (): void => {
    setTagFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSearch("");
  };

  const hasFilters = tagFilter !== "all" || locationFilter !== "all" || statusFilter !== "all" || search !== "";

  const renderTable = (): JSX.Element => {
    if (loading) {
      return <div className="p-10 text-center text-[#64748b] text-sm">Loading...</div>;
    }
    if (clients.length === 0) {
      return <ClientsEmptyState onAdd={() => setAddOpen(true)} />;
    }
    if (filteredSorted.length === 0) {
      return (
        <div className="p-10 text-center text-[#64748b] text-sm" data-testid="clients-no-results">
          No clients match your filters
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-[#007bff] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="clients-table">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#64748b]">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-6 py-3 font-bold">
                  <button
                    onClick={() => handleSort(col.key as string)}
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
                  {c.tags ? (
                    <div className="flex flex-wrap gap-1">
                      {(typeof c.tags === 'string' ? c.tags.split(',').map((t: string) => t.trim()) : c.tags).slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#007bff]/10 text-[#007bff] text-xs">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                      {(typeof c.tags === 'string' ? c.tags.split(',').map((t: string) => t.trim()) : c.tags).length > 3 && (
                        <span className="text-[#64748b] text-xs">+{(typeof c.tags === 'string' ? c.tags.split(',').map((t: string) => t.trim()) : c.tags).length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#64748b] text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {c.location ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs">
                      <MapPin className="h-3 w-3" />
                      {c.location}
                    </span>
                  ) : (
                    <span className="text-[#64748b] text-xs">-</span>
                  )}
                </td>
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
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        navigate(`/clients/${c.id}`);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      title={c.active ? "Deactivate" : "Activate"}
                      testId={`toggle-btn-${c.id}`}
                      onClick={(e: MouseEvent) => toggleActive(c, e)}
                      colorClass={c.active ? "text-[#ef4444] hover:text-[#ef4444]" : "text-[#10b981] hover:text-[#10b981]"}
                    >
                      <Power className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      testId={`delete-btn-${c.id}`}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        setToDelete(c);
                      }}
                      colorClass="text-[#ef4444] hover:text-[#ef4444]"
                    >
                      <Trash2 className="h-4 w-4" />
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
    <div className="p-6">
      <PageHeader
        title="Clients"
        subtitle="Manage your ADA widget clients"
        actions={
          <Button
            onClick={() => setAddOpen(true)}
            data-testid="add-client-btn"
            className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add client
          </Button>
        }
      />

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2e3245] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px] bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
              />
            </div>
            
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[160px] bg-[#0f1117] border-[#2e3245] text-white">
                <Tag className="h-4 w-4 mr-2 text-[#64748b]" />
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2130] border-[#2e3245]">
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[160px] bg-[#0f1117] border-[#2e3245] text-white">
                <MapPin className="h-4 w-4 mr-2 text-[#64748b]" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2130] border-[#2e3245]">
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-[#0f1117] border-[#2e3245] text-white">
                <Activity className="h-4 w-4 mr-2 text-[#64748b]" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2130] border-[#2e3245]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[#64748b] hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="text-xs text-[#64748b]" data-testid="clients-count">
            {filteredSorted.length} {filteredSorted.length === 1 ? "client" : "clients"}
            {hasFilters && ` (filtered from ${clients.length})`}
          </div>
        </div>

        {renderTable()}
      </div>

      <ClientFormModal open={addOpen} onOpenChange={setAddOpen} onCreated={() => load()} />

      <DeleteConfirmModal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
        clientName={toDelete?.name}
      />
    </div>
  );
}

interface SortIconProps {
  active: boolean;
  dir: "asc" | "desc";
}

function SortIcon({ active, dir }: SortIconProps): JSX.Element {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-60" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

interface IconBtnProps {
  children: React.ReactNode;
  onClick: (e: MouseEvent) => void;
  title: string;
  testId?: string;
  colorClass?: string;
}

function IconBtn({ children, onClick, title, testId, colorClass = "hover:text-white hover:border-[#3e445e]" }: IconBtnProps): JSX.Element {
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

interface ClientsEmptyStateProps {
  onAdd: () => void;
}

function ClientsEmptyState({ onAdd }: ClientsEmptyStateProps): JSX.Element {
  return (
    <div className="p-14 text-center" data-testid="clients-empty-state">
      <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3
        className="text-white font-semibold tracking-tight text-lg"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        No clients yet
      </h3>
      <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">
        Add your first one to start configuring widgets.
      </p>
      <Button
        onClick={onAdd}
        data-testid="empty-add-first-btn"
        className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add your first client
      </Button>
    </div>
  );
}
