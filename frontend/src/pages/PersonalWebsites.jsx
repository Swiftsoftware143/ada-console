import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ArrowRightLeft, XIcon, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
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
      if (websitesData?.value?.personal) setWebsites(websitesData.value.personal);
      const { data: catData } = await supabase.from("settings").select("value").eq("key", "website_categories").maybeSingle();
      if (catData?.value) setCategories(catData.value);
      const { data: locData } = await supabase.from("settings").select("value").eq("key", "website_locations").maybeSingle();
      if (locData?.value) setLocations(locData.value);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (e) => {
    e.preventDefault();
    const siteData = {
      id: editingSite ? editingSite.id : generateId(formData.name),
      name: formData.name, type: "personal", url: formData.url,
      repository: formData.repository || null, status: formData.status,
      tags: { category: formData.category || null, location: formData.location || null },
      created_date: editingSite?.created_date || new Date().toISOString().split("T")[0], notes: formData.notes
    };
    const { data: current } = await supabase.from("settings").select("value").eq("key", "websites").maybeSingle();
    const fullData = current?.value || { personal: [], clients: [] };
    if (editingSite) {
      const idx = fullData.personal.findIndex(s => s.id === editingSite.id);
      if (idx !== -1) fullData.personal[idx] = siteData;
    } else {
      fullData.personal.push(siteData);
    }
    await supabase.from("settings").upsert({ key: "websites", value: fullData, updated_at: new Date().toISOString() });
    setWebsites(fullData.personal);
    setShowForm(false);
    setEditingSite(null);
    setFormData({ name: "", url: "", repository: "", category: "", location: "", notes: "", status: "active" });
    toast.success(editingSite ? "Updated" : "Added");
  };

  const handleDelete = async (site) => {
    if (!confirm(`Delete "${site.name}"?`)) return;
    const { data: current } = await supabase.from("settings").select("value").eq("key", "websites").maybeSingle();
    const fullData = current?.value || { personal: [], clients: [] };
    fullData.personal = fullData.personal.filter(s => s.id !== site.id);
    await supabase.from("settings").upsert({ key: "websites", value: fullData, updated_at: new Date().toISOString() });
    setWebsites(fullData.personal);
    toast.success("Deleted");
  };

  const openEdit = (site) => {
    setEditingSite(site);
    setFormData({ name: site.name, url: site.url, repository: site.repository || "", category: site.tags?.category || "", location: site.tags?.location || "", notes: site.notes || "", status: site.status });
    setShowForm(true);
  };

  if (loading) return <div className="p-6 text-[#64748b]">Loading...</div>;

  return (
    <div className="p-6">
      <PageHeader title="Personal Websites" subtitle="Manage your own websites" actions={<Button onClick={() => setShowForm(true)} className="bg-[#007bff]"><Plus className="h-4 w-4 mr-2" />Add</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {websites.map(site => (
          <Card key={site.id} className="bg-[#1e2130] border-[#2e3245]">
            <CardContent className="p-4">
              <h3 className="text-white font-medium">{site.name}</h3>
              <a href={site.url} target="_blank" className="text-[#007bff] text-sm block truncate">{site.url}</a>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(site)} className="border-[#2e3245]"><Edit2 className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(site)} className="border-[#2e3245] text-red-400"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2130] border border-[#2e3245] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white text-lg mb-4">{editingSite ? "Edit" : "Add"} Website</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <Input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="bg-[#0f1117] border-[#2e3245]" />
              <Input placeholder="URL" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required className="bg-[#0f1117] border-[#2e3245]" />
              <Input placeholder="Repository (optional)" value={formData.repository} onChange={e => setFormData({...formData, repository: e.target.value})} className="bg-[#0f1117] border-[#2e3245]" />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-[#007bff]">Save</Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="border-[#2e3245]">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
