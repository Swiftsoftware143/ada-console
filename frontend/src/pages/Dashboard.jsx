import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, CheckCircle2, XCircle, Sparkles, Plus, ArrowRight, Inbox, Globe, Edit2, Trash2, ArrowRightLeft, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, isThisMonth } from "@/lib/helpers";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import ClientFormModal from "@/components/ClientFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = [
  "ecommerce", "saas", "local-business", "blog", "portfolio",
  "restaurant", "healthcare", "real-estate", "professional-services",
  "nonprofit", "education", "entertainment"
];

const DEFAULT_LOCATIONS = [
  "Palm Bay, FL", "Melbourne, FL", "Orlando, FL", "Miami, FL",
  "Tampa, FL", "Jacksonville, FL", "Boca Raton, FL", "Fort Lauderdale, FL"
];

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // Website Manager State
  const [activeTab, setActiveTab] = useState("all");
  const [websites, setWebsites] = useState({ personal: [], clients: [] });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [formData, setFormData] = useState({
    name: "", type: "personal", url: "", repository: "",
    category: "", location: "", notes: "", status: "active"
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setClients(data || []);
    setLoading(false);
  }, []);

  const loadWebsites = useCallback(async () => {
    try {
      const { data: websitesData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "websites")
        .maybeSingle();
      if (websitesData?.value) setWebsites(websitesData.value);

      const { data: categoriesData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "website_categories")
        .maybeSingle();
      if (categoriesData?.value) setCategories(categoriesData.value);

      const { data: locationsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "website_locations")
        .maybeSingle();
      if (locationsData?.value) setLocations(locationsData.value);
    } catch (e) {
      console.error("Error loading websites:", e);
    }
  }, []);

  useEffect(() => {
    load();
    loadWebsites();
  }, [load, loadWebsites]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.active).length;
    const inactive = total - active;
    const thisMonth = clients.filter((c) => isThisMonth(c.created_at)).length;
    const totalWebsites = websites.personal.length + websites.clients.length;
    return { total, active, inactive, thisMonth, totalWebsites };
  }, [clients, websites]);

  const recent = clients.slice(0, 5);

  // Website Manager Functions
  const generateId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const saveWebsites = async (newWebsites) => {
    try {
      const { error } = await supabase.from("settings").upsert({
        key: "websites", value: newWebsites, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setWebsites(newWebsites);
    } catch (e) {
      toast.error("Failed to save websites");
    }
  };

  const handleSaveWebsite = async (e) => {
    e.preventDefault();
    const siteData = {
      id: editingSite ? editingSite.id : generateId(formData.name),
      name: formData.name, type: formData.type, url: formData.url,
      netlify_url: editingSite?.netlify_url || null, repository: formData.repository || null,
      status: formData.status, tags: { category: formData.category || null, location: formData.location || null },
      description: formData.notes, created_date: editingSite?.created_date || new Date().toISOString().split('T')[0], notes: formData.notes
    };
    if (formData.type === "client") {
      siteData.client_info = editingSite?.client_info || { name: null, email: null, phone: null, contract_start: null, monthly_fee: 0 };
    }
    const newWebsites = { ...websites };
    const typeKey = formData.type === "personal" ? "personal" : "clients";
    if (editingSite) {
      const oldTypeKey = editingSite.type === "personal" ? "personal" : "clients";
      if (oldTypeKey !== typeKey) {
        newWebsites[oldTypeKey] = newWebsites[oldTypeKey].filter(s => s.id !== editingSite.id);
        newWebsites[typeKey].push(siteData);
      } else {
        const index = newWebsites[typeKey].findIndex(s => s.id === editingSite.id);
        if (index !== -1) newWebsites[typeKey][index] = siteData;
      }
    } else {
      newWebsites[typeKey].push(siteData);
    }
    await saveWebsites(newWebsites);
    setShowForm(false);
    setEditingSite(null);
    setFormData({ name: "", type: "personal", url: "", repository: "", category: "", location: "", notes: "", status: "active" });
    toast.success(editingSite ? "Website updated" : "Website added");
  };

  const handleDeleteWebsite = async (site) => {
    if (!confirm(`Delete "${site.name}"?`)) return;
    const newWebsites = { ...websites };
    const typeKey = site.type === "personal" ? "personal" : "clients";
    newWebsites[typeKey] = newWebsites[typeKey].filter(s => s.id !== site.id);
    await saveWebsites(newWebsites);
    toast.success("Website deleted");
  };

  const handleMoveWebsite = async (site) => {
    const newType = site.type === "personal" ? "client" : "personal";
    const newWebsites = { ...websites };
    const oldKey = site.type === "personal" ? "personal" : "clients";
    newWebsites[oldKey] = newWebsites[oldKey].filter(s => s.id !== site.id);
    const updatedSite = { ...site, type: newType };
    if (newType === "client") {
      updatedSite.client_info = site.client_info || { name: null, email: null, phone: null, contract_start: null, monthly_fee: 0 };
    } else {
      delete updatedSite.client_info;
    }
    const newKey = newType === "personal" ? "personal" : "clients";
    newWebsites[newKey].push(updatedSite);
    await saveWebsites(newWebsites);
    toast.success(`Moved to ${newType}`);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const category = newCategory.trim().toLowerCase();
    if (categories.includes(category)) { toast.error("Category exists"); return; }
    const newCategories = [...categories, category];
    try {
      await supabase.from("settings").upsert({ key: "website_categories", value: newCategories, updated_at: new Date().toISOString() });
      setCategories(newCategories);
      setNewCategory("");
      toast.success("Category added");
    } catch (e) { toast.error("Failed to add category"); }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete "${category}"?`)) return;
    const newCategories = categories.filter(c => c !== category);
    try {
      await supabase.from("settings").upsert({ key: "website_categories", value: newCategories, updated_at: new Date().toISOString() });
      setCategories(newCategories);
      toast.success("Category deleted");
    } catch (e) { toast.error("Failed to delete category"); }
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    const location = newLocation.trim();
    if (locations.includes(location)) { toast.error("Location exists"); return; }
    const newLocations = [...locations, location];
    try {
      await supabase.from("settings").upsert({ key: "website_locations", value: newLocations, updated_at: new Date().toISOString() });
      setLocations(newLocations);
      setNewLocation("");
      toast.success("Location added");
    } catch (e) { toast.error("Failed to add location"); }
  };

  const handleDeleteLocation = async (location) => {
    if (!confirm(`Delete "${location}"?`)) return;
    const newLocations = locations.filter(l => l !== location);
    try {
      await supabase.from("settings").upsert({ key: "website_locations", value: newLocations, updated_at: new Date().toISOString() });
      setLocations(newLocations);
      toast.success("Location deleted");
    } catch (e) { toast.error("Failed to delete location"); }
  };

  const openEditForm = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name, type: site.type, url: site.url, repository: site.repository || "",
      category: site.tags?.category || "", location: site.tags?.location || "",
      notes: site.notes || "", status: site.status
    });
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditingSite(null);
    setFormData({ name: "", type: "personal", url: "", repository: "", category: "", location: "", notes: "", status: "active" });
    setShowForm(true);
  };

  const getFilteredWebsites = () => {
    let allSites = [...websites.personal.map(s => ({ ...s, type: "personal" })), ...websites.clients.map(s => ({ ...s, type: "client" }))];
    if (activeTab !== "all") allSites = allSites.filter(s => s.type === activeTab);
    if (filterCategory) allSites = allSites.filter(s => s.tags?.category === filterCategory);
    if (filterLocation) allSites = allSites.filter(s => s.tags?.location === filterLocation);
    if (filterStatus) allSites = allSites.filter(s => s.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      allSites = allSites.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
    }
    return allSites;
  };

  const filteredSites = getFilteredWebsites();

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
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">{c.plan_tier}</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <StatCard label="Total Clients" value={loading ? "—" : stats.total} icon={Users} accentClass="text-[#007bff]" testId="stat-total-clients" />
        <StatCard label="Active Widgets" value={loading ? "—" : stats.active} icon={CheckCircle2} accentClass="text-[#10b981]" testId="stat-active-widgets" />
        <StatCard label="Inactive Widgets" value={loading ? "—" : stats.inactive} icon={XCircle} accentClass="text-[#ef4444]" testId="stat-inactive-widgets" />
        <StatCard label="New This Month" value={loading ? "—" : stats.thisMonth} icon={Sparkles} accentClass="text-[#a78bfa]" testId="stat-new-this-month" />
        <StatCard label="Total Websites" value={stats.totalWebsites} icon={Globe} accentClass="text-[#f59e0b]" testId="stat-total-websites" />
      </div>

      {/* Website Manager Section */}
      <Card className="mb-10 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5 text-[#007bff]" />
                Website Manager
              </CardTitle>
              <p className="text-xs text-[#64748b] mt-1">Manage your personal and client websites</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(!showCategoryManager)} className="border-[#2e3245] text-[#94a3b8]">
                Manage Categories
              </Button>
              <Button size="sm" onClick={openAddForm} className="bg-[#007bff] hover:bg-[#0056b3]">
                <Plus className="h-4 w-4 mr-1" /> Add Website
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            {["all", "personal", "client"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-[#007bff] text-white" : "bg-[#0f1117] text-[#94a3b8] hover:text-white"}`}>
                {tab === "all" ? "All Websites" : tab === "personal" ? "Personal" : "Clients"}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="development">Development</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search websites..." className="bg-[#0f1117] border-[#2e3245] text-white w-48" />
          </div>

          {/* Websites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[#64748b]">No websites found. Add one to get started.</div>
            ) : (
              filteredSites.map(site => (
                <div key={site.id} className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium">{site.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${site.type === "personal" ? "bg-[#007bff]" : "bg-[#059669]"} text-white`}>{site.type}</span>
                  </div>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[#64748b] text-sm hover:text-[#007bff] block mb-2 truncate">{site.url}</a>
                  {site.repository && <div className="text-[#64748b] text-xs mb-2 font-mono">📁 {site.repository}</div>}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {site.tags?.category && <span className="text-xs px-2 py-1 rounded-full bg-[#007bff]/20 text-[#007bff]">{site.tags.category}</span>}
                    {site.tags?.location && <span className="text-xs px-2 py-1 rounded-full bg-[#059669]/20 text-[#059669]">{site.tags.location}</span>}
                    <span className={`text-xs px-2 py-1 rounded-full ${site.status === "active" ? "bg-green-500/20 text-green-400" : site.status === "inactive" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{site.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleMoveWebsite(site)} className="flex-1 border-[#2e3245] text-[#94a3b8]"><ArrowRightLeft className="h-3 w-3 mr-1" /> Move</Button>
                    <Button size="sm" variant="outline" onClick={() => openEditForm(site)} className="flex-1 border-[#2e3245] text-[#94a3b8]"><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteWebsite(site)} className="border-[#2e3245] text-red-400"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Manager (Collapsible) */}
      {showCategoryManager && (
        <Card className="mb-10 bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Categories & Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-[#94a3b8] text-sm mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0f1117] text-[#94a3b8] text-sm">
                    {cat}<button onClick={() => handleDeleteCategory(cat)} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category..." className="bg-[#0f1117] border-[#2e3245] text-white w-48" />
                <Button onClick={handleAddCategory} className="bg-[#007bff] hover:bg-[#0056b3]"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <h4 className="text-[#94a3b8] text-sm mb-3">Locations</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {locations.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0f1117] text-[#94a3b8] text-sm">
                    {loc}<button onClick={() => handleDeleteLocation(loc)} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="New location..." className="bg-[#0f1117] border-[#2e3245] text-white w-48" />
                <Button onClick={handleAddLocation} className="bg-[#007bff] hover:bg-[#0056b3]"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Clients */}
      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#2e3245]">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Recent clients</h2>
            <p className="text-xs text-[#64748b] mt-0.5">The five most recently added accounts</p>
          </div>
          <Link to="/clients" data-testid="view-all-clients-link" className="text-xs text-[#007bff] font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {renderRecent()}
      </div>

      {/* Add/Edit Website Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2130] border border-[#2e3245] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-lg font-medium mb-4">{editingSite ? "Edit Website" : "Add Website"}</h3>
            <form onSubmit={handleSaveWebsite} className="space-y-4">
              <div><Label className="text-[#94a3b8]">Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-[#0f1117] border-[#2e3245] text-white" /></div>
              <div><Label className="text-[#94a3b8]">Type *</Label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-white">
                  <option value="personal">Personal</option><option value="client">Client</option>
                </select></div>
              <div><Label className="text-[#94a3b8]">URL *</Label>
                <Input value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} required className="bg-[#0f1117] border-[#2e3245] text-white" /></div>
              <div><Label className="text-[#94a3b8]">Repository</Label>
                <Input value={formData.repository} onChange={(e) => setFormData({...formData, repository: e.target.value})} className="bg-[#0f1117] border-[#2e3245] text-white" placeholder="owner/repo" /></div>
              <div><Label className="text-[#94a3b8]">Category</Label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-white">
                  <option value="">Select...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div><Label className="text-[#94a3b8]">Location</Label>
                <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-white">
                  <option value="">Select...</option>{locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div><Label className="text-[#94a3b8]">Status</Label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#0f1117] border border-[#2e3245] rounded-lg px-3 py-2 text-white">
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                  <option value="development">Development</option><option value="maintenance">Maintenance</option>
                </select></div>
              <div><Label className="text-[#94a3b8]">Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-[#0f1117] border-[#2e3245] text-white" /></div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-[#007bff] hover:bg-[#0056b3]">Save</Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="border-[#2e3245] text-[#94a3b8]">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ClientFormModal open={modalOpen} onOpenChange={setModalOpen} onCreated={() => load()} />
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="p-12 text-center" data-testid="dashboard-empty-state">
      <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-[#64748b]" />
      </div>
      <h3 className="text-white font-semibold tracking-tight text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>No clients yet</h3>
      <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">Add your first client to start managing ADA widgets.</p>
      <Button onClick={onAdd} data-testid="empty-state-add-btn" className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]">
        <Plus className="h-4 w-4 mr-2" />Add your first client
      </Button>
    </div>
  );
}
