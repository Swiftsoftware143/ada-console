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
  contact_email: "",
  contact_name: "",
  plan_tier: "basic",
  tags: [],
  location: "",
  notes: "",
};

export default function PersonalWebsiteFormModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState);
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    // Load tags from settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "tags")
      .maybeSingle();
    
    if (settingsData?.value) {
      const parsed = typeof settingsData.value === 'string'
        ? settingsData.value.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(settingsData.value) ? settingsData.value : [];
      setAvailableTags(parsed);
    } else {
      setAvailableTags(["Medical", "Local Business", "E-commerce", "Professional Services", "Non-Profit", "Enterprise", "Basic Plan", "Pro Plan"]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Website name is required");
      return;
    }
    if (!form.domain.trim()) {
      toast.error("Domain is required");
      return;
    }
    if (!form.contact_email.trim()) {
      toast.error("Contact email is required for scan reports and widget delivery");
      return;
    }

    setSaving(true);
    
    // Find tags that are new (not in availableTags) - case-insensitive
    const newTags = form.tags.filter(tag => 
      !availableTags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
    
    // Add new tags to settings
    if (newTags.length > 0) {
      try {
        const { data: settingsData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "tags")
          .maybeSingle();
        
        let currentTags = [];
        if (settingsData?.value) {
          currentTags = typeof settingsData.value === 'string'
            ? settingsData.value.split(',').map(t => t.trim()).filter(Boolean)
            : Array.isArray(settingsData.value) ? settingsData.value : [];
        }
        
        // Case-insensitive check against settings tags
        const tagsToAdd = newTags.filter(tag => 
          !currentTags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
        if (tagsToAdd.length > 0) {
          const updatedTags = [...currentTags, ...tagsToAdd];
          // Try update first, then insert if not exists
          const { error: updateError } = await supabase
            .from("settings")
            .update({ 
              value: updatedTags.join(", "),
              updated_at: new Date().toISOString() 
            })
            .eq("key", "tags");
          
          if (updateError) {
            console.log("Update failed, trying insert:", updateError);
            // If update fails, try insert
            const { error: insertError } = await supabase
              .from("settings")
              .insert({ 
                key: "tags", 
                value: updatedTags.join(", "),
                updated_at: new Date().toISOString() 
              });
            if (insertError) {
              console.error("Insert also failed:", insertError);
            }
          }
        }
      } catch (e) {
        console.error("Error adding tags to settings:", e);
      }
    }
    
    // Store tags as comma-separated string
    const tagsString = form.tags.length > 0 ? form.tags.join(', ') : null;
    
    const payload = {
      name: form.name.trim(),
      domain: cleanDomain(form.domain),
      contact_email: form.contact_email.trim() || null,
      contact_name: form.contact_name.trim() || null,
      plan_tier: form.plan_tier,
      tags: tagsString,
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

    const { data, error } = await supabase
      .from("personal_websites")
      .insert(payload)
      .select();

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("A website with this domain already exists");
      } else {
        toast.error(error.message || "Failed to create website");
      }
      return;
    }

    toast.success(`${data?.[0]?.name || "Website"} added successfully`);
    onCreated?.(data?.[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2130] border border-[#2e3245] text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Add Personal Website
          </DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            Create an ADA widget for your personal website.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Website Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Website"
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Domain
            </Label>
            <Input
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="example.com"
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
            />
            <p className="text-xs text-[#64748b]">
              https://, www., and trailing slashes are stripped automatically.
            </p>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
                Contact Name
              </Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="John Doe"
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
                Contact Email *
              </Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="john@example.com"
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Tags
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
            
            {/* Quick-add from existing tags - case-insensitive filter */}
            <div className="flex flex-wrap gap-1 mb-2">
              {availableTags.filter(t => !form.tags.some(ft => ft.toLowerCase() === t.toLowerCase())).slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setForm({ ...form, tags: [...form.tags, tag] })}
                  className="px-2 py-1 bg-[#2e3245] text-[#94a3b8] rounded text-xs hover:bg-[#007bff]/20 hover:text-[#007bff]"
                >
                  + {tag}
                </button>
              ))}
            </div>
            
            {/* Add custom tag */}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmedTag = tagInput.trim();
                    // Case-insensitive duplicate check
                    const tagExists = form.tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase());
                    if (trimmedTag && !tagExists) {
                      setForm({ ...form, tags: [...form.tags, trimmedTag] });
                      setTagInput("");
                    } else if (tagExists) {
                      toast.error("Tag already added");
                    }
                  }
                }}
                placeholder="Add custom tag..."
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const trimmedTag = tagInput.trim();
                  // Case-insensitive duplicate check
                  const tagExists = form.tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase());
                  if (trimmedTag && !tagExists) {
                    setForm({ ...form, tags: [...form.tags, trimmedTag] });
                    setTagInput("");
                  } else if (tagExists) {
                    toast.error("Tag already added");
                  }
                }}
                className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27]"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-[#64748b]">
              Click quick tags above or type custom. Manage all tags in Settings → Tag Manager.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Location
            </Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City, State"
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Plan Tier
            </Label>
            <Select value={form.plan_tier} onValueChange={(v) => setForm({ ...form, plan_tier: v })}>
              <SelectTrigger className="bg-[#0f1117] border-[#2e3245] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2130] border-[#2e3245] text-white">
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#64748b] font-bold">
              Notes
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27]">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating</> : "Create Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
