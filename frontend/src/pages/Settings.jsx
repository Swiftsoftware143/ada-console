import { useCallback, useEffect, useState } from "react";
import { Save, Globe, Building2, Plus, X, Edit2, Trash2, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";

const DEFAULT_CDN_DOMAIN = "https://adaswift.netlify.app";
const CUSTOM_CDN_DOMAIN = "https://cdn.swiftimpactsolutions.com";
const DEFAULT_AGENCY_NAME = "SwiftImpact Solutions";
const DEFAULT_CTA_URL = "https://swiftimpactsolutions.com/ada";

const DEFAULT_CATEGORIES = [
  "ecommerce", "saas", "local-business", "blog", "portfolio",
  "restaurant", "healthcare", "real-estate", "professional-services",
  "nonprofit", "education", "entertainment"
];

const DEFAULT_LOCATIONS = [
  "Palm Bay, FL", "Melbourne, FL", "Orlando, FL", "Miami, FL",
  "Tampa, FL", "Jacksonville, FL", "Boca Raton, FL", "Fort Lauderdale, FL"
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cdnDomain, setCdnDomain] = useState(DEFAULT_CDN_DOMAIN);
  const [previewDomain, setPreviewDomain] = useState("clientdomain.com");
  const [agencyName, setAgencyName] = useState(DEFAULT_AGENCY_NAME);
  const [ctaUrl, setCtaUrl] = useState(DEFAULT_CTA_URL);
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
  const [formData, setFormData] = useState({
    name: "", type: "personal", url: "", repository: "",
    category: "", location: "", notes: "", status: "active"
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cdnData } = await supabase.from("settings").select("value").eq("key", "cdn_domain").maybeSingle();
      if (cdnData?.value) setCdnDomain(cdnData.value);
      const { data: agencyData } = await supabase.from("settings").select("value").eq("key", "agency_name").maybeSingle();
      if (agencyData?.value) setAgencyName(agencyData.value);
      const { data: ctaData } = await supabase.from("settings").select("value").eq("key", "cta_url").maybeSingle();
      if (ctaData?.value) setCtaUrl(ctaData.value);
      const { data: websitesData } = await supabase.from("settings").select("value").eq("key", "websites").maybeSingle();
      if (websitesData?.value) setWebsites(websitesData.value);
      const { data: categoriesData } = await supabase.from("settings").select("value").eq("key", "website_categories").maybeSingle();
      if (categoriesData?.value) setCategories(categoriesData.value);
      const { data: locationsData } = await supabase.from("settings").select("value").eq("key", "website_locations").maybeSingle();
      if (locationsData?.value) setLocations(locationsData.value);
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const generateEmbedPreview = () => {
    return \`<script>!function(){var s=document.createElement("script");s.src="\${cdnDomain}/loader.js";s.setAttribute("data-domain","\${previewDomain}");s.async=!0;document.body.appendChild(s)}();</script>\`;
  };

  const handleSaveCdnDomain = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({ key: "cdn_domain", value: cdnDomain, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("CDN domain updated");
    } catch (e) {
      toast.error("Failed to save CDN domain");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgencyDefaults = async () => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "agency_name", value: agencyName, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "cta_url", value: ctaUrl, updated_at: new Date().toISOString() });
      toast.success("Agency defaults saved");
    } catch (e) {
      toast.error("Failed to save agency defaults");
    } finally {
      setSaving(false);
    }
  };

  const generateId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const saveWebsites = async (newWebsites) => {
    try {
      const { error } = await supabase.from("settings").upsert({ key: "websites", value: newWebsites, updated_at: new Date().toISOString() });
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
    if (!confirm(\`Delete "\${site.name}"?\`)) return;
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
    toast.success(\`Moved to \${newType}\`);
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
    if (!confirm(\`Delete "\${category}"?\`)) return;
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
    if (!confirm(\`Delete "\${location}"?\`)) return;
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

  const setNetlifyUrl = () => setCdnDomain(DEFAULT_CDN_DOMAIN);
  const setCustomUrl = () => setCdnDomain(CUSTOM_CDN_DOMAIN);
  const filteredSites = getFilteredWebsites();

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Console Settings" subtitle="Manage your ADA console configuration" />
        <div className="mt-6 text-[#64748b]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Console Settings" subtitle="Manage your ADA console configuration" />

      {/* Website Manager */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-[#007bff]" />
            Website Manager
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">Manage personal and client websites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            {["all", "personal", "client"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === tab ? "bg-[#007bff] text-white" : "bg-[#0f1117] text-[#94a3b8] hover:text-white"}\`}>
                {tab === "all" ? "All Websites" : tab === "personal" ? "Personal" : "Clients"}
              </button>
            ))}
          </div>

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
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-[#0f1117] border-[#2e3245] text-white w-48" />
            <Button onClick={openAddForm} className="bg-[#007bff] hover:bg-[#0056b3]"><Plus className="h-4 w-4 mr-2" /> Add</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#64748b]">No websites found</div>
            ) : (
              filteredSites.map(site => (
                <div key={site.id} className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium">{site.name}</h3>
                    <span className={\`text-xs px-2 py-1 rounded-full \${site.type === "personal" ? "bg-[#007bff]" : "bg-[#059669]"} text-white\`}>{site.type}</span>
                  </div>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[#64748b] text-sm hover:text-[#007bff] block mb-2 truncate">{site.url}</a>
                  {site.repository && <div className="text-[#64748b] text-xs mb-2 font-mono">📁 {site.repository}</div>}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {site.tags?.category && <span className="text-xs px-2 py-1 rounded-full bg-[#007bff]/20 text-[#007bff]">{site.tags.category}</span>}
                    {site.tags?.location && <span className="text-xs px-2 py-1 rounded-full bg-[#059669]/20 text-[#059669]">{site.tags.location}</span>}
                    <span className={\`text-xs px-2 py-1 rounded-full \${site.status === "active" ? "bg-green-500/20 text-green-400" : site.status === "inactive" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}\`}>{site.status}</span>
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

      {/* Add/Edit Form Modal */}
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

      {/* Categories & Locations */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="text-white">Categories & Locations</CardTitle>
          <CardDescription className="text-[#94a3b8]">Manage website organization</CardDescription>
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

      {/* CDN Domain */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-[#007bff]" />
            Loader Script Domain
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">Control which domain serves the ADA loader script</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-[#94a3b8]">CDN Domain URL</Label>
            <Input value={cdnDomain} onChange={(e) => setCdnDomain(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={setNetlifyUrl} className="border-[#2e3245] text-[#94a3b8]">Use Netlify URL</Button>
            <Button variant="outline" onClick={setCustomUrl} className="border-[#2e3245] text-[#94a3b8]">Use Custom Domain</Button>
          </div>
          <div>
            <Label className="text-[#94a3b8]">Live Preview</Label>
            <div className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4">
              <div className="text-xs text-[#64748b] mb-2">Preview:
                <Input value={previewDomain} onChange={(e) => setPreviewDomain(e.target.value)} className="inline-block w-48 ml-2 bg-[#1e2130] border-[#2e3245] text-white text-xs h-7" />
              </div>
              <code className="block text-xs text-[#94a3b8] font-mono break-all">{generateEmbedPreview()}</code>
            </div>
          </div>
          <Button onClick={handleSaveCdnDomain} disabled={saving} className="bg-[#007bff] hover:bg-[#0056b3]">
            {saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save</>}
          </Button>
        </CardContent>
      </Card>

      {/* Agency Defaults */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-[#007bff]" />
            Agency Defaults
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">Default values for new clients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-[#94a3b8]">Default Agency Name</Label>
            <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <div>
            <Label className="text-[#94a3b8]">Default CTA URL</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <Button onClick={handleSaveAgencyDefaults} disabled={saving} className="bg-[#007bff] hover:bg-[#0056b3]">
            {saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Agency Defaults</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
