import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ArrowRightLeft, X, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Personal Websites Page
import PageHeader from "@/components/PageHeader";

const DEFAULT_CATEGORIES = [
  "ecommerce", "saas", "local-business", "blog", "portfolio",
  "restaurant", "healthcare", "real-estate", "professional-services",
  "nonprofit", "education", "entertainment"
];

const DEFAULT_LOCATIONS = [
  "Palm Bay, FL", "Melbourne, FL", "Orlando, FL", "Miami, FL",
  "Tampa, FL", "Jacksonville, FL", "Boca Raton, FL", "Fort Lauderdale, FL"
];

export default function PersonalWebsites() {
  const [loading, setLoading] = useState(true);
  const [websites, setWebsites] = useState([]);
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
    name: "", url: "", repository: "", category: "", location: "", notes: "", status: "active"
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: websitesData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "websites")
        .maybeSingle();
      
      if (websitesData?.value?.personal) {
        setWebsites(websitesData.value.personal);
      }

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const saveWebsites = async (newPersonal) => {
    try {
      // Get current full websites object
      const { data: current } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "websites")
        .maybeSingle();
      
      const fullData = current?.value || { personal: [], clients: [] };
      fullData.personal = newPersonal;
      
      const { error } = await supabase.from("settings").upsert({
        key: "websites", value: fullData, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setWebsites(newPersonal);
    } catch (e) {
      toast.error("Failed to save websites");
    }
  };

  const handleSaveWebsite = async (e) => {
    e.preventDefault();
    const siteData = {
      id: editingSite ? editingSite.id : generateId(formData.name),
      name: formData.name, type: "personal", url: formData.url,
      netlify_url: editingSite?.netlify_url || null, repository: formData.repository || null,
      status: formData.status, tags: { category: formData.category || null, location: formData.location || null },
      description: formData.notes, created_date: editingSite?.created_date || new Date().toISOString().split('T')[0], notes: formData.notes
    };
    
    let newWebsites = [...websites];
    if (editingSite) {
      const index = newWebsites.findIndex(s => s.id === editingSite.id);
      if (index !== -1) newWebsites[index] = siteData;
    } else {
      newWebsites.push(siteData);
    }
    
    await saveWebsites(newWebsites);
    setShowForm(false);
    setEditingSite(null);
    setFormData({ name: "", url: "", repository: "", category: "", location: "", notes: "", status: "active" });
    toast.success(editingSite ? "Website updated" : "Website added");
  };

  const handleDeleteWebsite = async (site) => {
    if (!confirm(`Delete "${site.name}"?`)) return;
    const newWebsites = websites.filter(s => s.id !== site.id);
    await saveWebsites(newWebsites);
    toast.success("Website deleted");
  };

  const handleMoveToClients = async (site) => {
    if (!confirm(`Move "${site.name}" to Clients?`)) return;
    
    // Remove from personal
    const newPersonal = websites.filter(s => s.id !== site.id);
    await saveWebsites(newPersonal);
    
    // Add to clients
    const { data: current } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "websites")
      .maybeSingle();
    
    const fullData = current?.value || { personal: [], clients: [] };
    const updatedSite = { ...site, type: "client", client_info: { name: null, email: null, phone: null, contract_start: null, monthly_fee: 0 } };
    fullData.clients = [...(fullData.clients || []), updatedSite];
    
    await supabase.from("settings").upsert({
      key: "websites", value: fullData, updated_at: new Date().toISOString()
    });
    
    toast.success("Moved to Clients");
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
      name: site.name, url: site.url, repository: site.repository || "",
      category: site.tags?.category || "", location: site.tags?.location || "",
      notes: site.notes || "", status: site.status
    });
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditingSite(null);
    setFormData({ name: "", url: "", repository: "", category: "", location: "", notes: "", status: "active" });
    setShowForm(true);
  };

  const getFilteredWebsites = () => {
    let filtered = [...websites];
    if (filterCategory) filtered = filtered.filter(s => s.tags?.category === filterCategory);
    if (filterLocation) filtered = filtered.filter(s => s.tags?.location === filterLocation);
    if (filterStatus) filtered = filtered.filter(s => s.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
    }
    return filtered;
  };

  const filteredSites = getFilteredWebsites();

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Personal Websites" subtitle="Manage your own websites and projects" />
        <div className="mt-6 text-[#64748b]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Personal Websites"
        subtitle="Manage your own websites and projects"
        actions={
          <Button onClick={openAddForm} className="bg-[#007bff] hover:bg-[#0056b3]">
            <Plus className="h-4 w-4 mr-2" /> Add Website
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-white">{websites.length}</div>
            <div className="text-sm text-[#64748b]">Total Websites</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-[#10b981]">{websites.filter(s => s.status === "active").length}</div>
            <div className="text-sm text-[#64748b]">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-yellow-500">{websites.filter(s => s.status === "development").length}</div>
            <div className="text-sm text-[#64748b]">In Development</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-[#a78bfa]">{new Set(websites.map(s => s.tags?.category).filter(Boolean)).size}</div>
            <div className="text-sm text-[#64748b]">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-[#1e2130] border-[#2e3245]">
        <CardContent className="p-4">
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
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search websites..." className="bg-[#0f1117] border-[#2e3245] text-white w-64" />
            <Button variant="outline" onClick={() => setShowCategoryManager(!showCategoryManager)} className="border-[#2e3245] text-[#94a3b8] ml-auto">
              Manage Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Manager */}
      {showCategoryManager && (
        <Card className="mb-6 bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white text-base">Categories & Locations</CardTitle>
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

      {/* Websites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#64748b] bg-[#1e2130] border border-[#2e3245] rounded-xl">
            <Globe className="h-12 w-12 mx-auto mb-4 text-[#2e3245]" />
            <h3 className="text-white font-medium mb-2">No personal websites yet</h3>
            <p className="text-sm mb-4">Add your first personal website to get started.</p>
            <Button onClick={openAddForm} className="bg-[#007bff] hover:bg-[#0056b3]">
              <Plus className="h-4 w-4 mr-2" /> Add Website
            </Button>
          </div>
        ) : (
          filteredSites.map(site => (
            <Card key={site.id} className="bg-[#1e2130] border-[#2e3245]">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-medium text-lg">{site.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${site.status === "active" ? "bg-green-500/20 text-green-400" : site.status === "inactive" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{site.status}</span>
                </div>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[#007bff] text-sm hover:underline block mb-2 truncate">{site.url}</a>
                {site.repository && <div className="text-[#64748b] text-xs mb-3 font-mono">📁 {site.repository}</div>}
                <div className="flex flex-wrap gap-2 mb-4">
                  {site.tags?.category && <span className="text-xs px-2 py-1 rounded-full bg-[#007bff]/20 text-[#007bff]">{site.tags.category}</span>}
                  {site.tags?.location && <span className="text-xs px-2 py-1 rounded-full bg-[#059669]/20 text-[#059669]">{site.tags.location}</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleMoveToClients(site)} className="flex-1 border-[#2e3245] text-[#94a3b8]"><ArrowRightLeft className="h-3 w-3 mr-1" /> To Clients</Button>
                  <Button size="sm" variant="outline" onClick={() => openEditForm(site)} className="flex-1 border-[#2e3245] text-[#94a3b8]"><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteWebsite(site)} className="border-[#2e3245] text-red-400"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2130] border border-[#2e3245] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-lg font-medium mb-4">{editingSite ? "Edit Website" : "Add Website"}</h3>
            <form onSubmit={handleSaveWebsite} className="space-y-4">
              <div><Label className="text-[#94a3b8]">Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-[#0f1117] border-[#2e3245] text-white" /></div>
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
    </div>
  );
}
