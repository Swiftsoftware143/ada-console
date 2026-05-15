import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cleanDomain } from "@/lib/helpers";
import { supabase, DEFAULT_PROFILES, DEFAULT_FEATURES } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const initialState = {
  name: "",
  domain: "",
  plan_tier: "basic",
  category: "",
  tags: [],
  location: "",
  notes: "",
};

export default function ClientFormModal({ open, onOpenChange, onCreated, isPersonal = false }) {
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState);
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    const [{ data: clients }, { data: websites }] = await Promise.all([
      supabase.from("clients").select("category,tags"),
      supabase.from("personal_websites").select("category,tags"),
    ]);
    
    const allCategories = new Set();
    const allTags = new Set();
    
    [...(clients || []), ...(websites || [])].forEach(item => {
      if (item.category) allCategories.add(item.category);
      // Handle both array and comma-separated string formats
      if (item.tags) {
        if (Array.isArray(item.tags)) {
          item.tags.forEach(tag => allTags.add(tag));
        } else if (typeof item.tags === 'string') {
          item.tags.split(',').forEach(tag => allTags.add(tag.trim()));
        }
      }
    });
    
    setCategories(Array.from(allCategories).sort());
    setAvailableTags(Array.from(allTags).sort());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(isPersonal ? "Website name is required" : "Client name is required");
      return;
    }
    if (!form.domain.trim()) {
      toast.error("Domain is required");
      return;
    }

    setSaving(true);
    // Combine category and tags - store as comma-separated in category field
    // or use tags array if the column exists
    const combinedTags = form.tags.length > 0 
      ? (form.category ? [form.category, ...form.tags] : form.tags).join(', ')
      : form.category;
    
    const payload = {
      name: form.name.trim(),
      domain: cleanDomain(form.domain),
      plan_tier: form.plan_tier,
      category: combinedTags || null,
      tags: form.tags.length > 0 ? form.tags : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      active: false,
      agency_name: "SwiftImpact Solutions",
      cta_url: "https://swiftimpactsolutions.com/ada",
      widget_position: "bottom-left",
      primary_color: "#007bff",
      enabled_profiles: DEFAULT_PROFILES,
      enabled_features: DEFAULT_FEATURES,
    };

    const tableName = isPersonal ? "personal_websites" : "clients";
    console.log("Inserting into", tableName, "payload:", payload);
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select();
    console.log("Insert result:", { data, error });

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("A website with this domain already exists");
      } else {
        toast.error(error.message || "Failed to create website");
      }
      return;
    }

    toast.success(isPersonal ? "Website added successfully" : "Client added successfully");
    onCreated?.(data?.[0] || { id: Date.now() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="add-client-modal"
        className="bg-[#1e2130] border border-[#2e3245] text-white sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            {isPersonal ? "Add Personal Website" : "Add new client"}
          </DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            {isPersonal 
              ? "Create an ADA widget for your personal website." 
              : "Create a new client. You can configure widget defaults afterwards."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="client-name" className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              {isPersonal ? "Website Name" : "Client Name"}
            </Label>
            <Input
              id="client-name"
              data-testid="add-client-name-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isPersonal ? "My Website" : "Acme Co"}
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-domain" className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Domain
            </Label>
            <Input
              id="client-domain"
              data-testid="add-client-domain-input"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="example.com"
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
            />
            <p className="text-xs text-[#64748b]">
              https://, www., and trailing slashes are stripped automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
                Category
              </Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Type new or existing category..."
                list="category-suggestions"
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
              />
              <datalist id="category-suggestions">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
                Location
              </Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, State"
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Tags (Industry/Type)
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#007bff]/20 text-[#007bff] rounded text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) })}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
                      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
                      setTagInput("");
                    }
                  }
                }}
                placeholder="Type tag and press Enter..."
                list="tag-suggestions"
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
                    setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
                    setTagInput("");
                  }
                }}
                className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27]"
              >
                Add
              </Button>
            </div>
            <datalist id="tag-suggestions">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <p className="text-xs text-[#64748b]">
              Add multiple tags to categorize by industry, business type, etc.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Plan Tier
            </Label>
            <Select
              value={form.plan_tier}
              onValueChange={(v) => setForm({ ...form, plan_tier: v })}
            >
              <SelectTrigger
                data-testid="add-client-plan-trigger"
                className="bg-[#0f1117] border-[#2e3245] text-white focus:ring-[#007bff]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2130] border-[#2e3245] text-white">
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Internal Notes
            </Label>
            <Textarea
              data-testid="add-client-notes-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="add-client-cancel-btn"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              data-testid="add-client-submit-btn"
              className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating
                </>
              ) : (
                isPersonal ? "Create Website" : "Create Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
