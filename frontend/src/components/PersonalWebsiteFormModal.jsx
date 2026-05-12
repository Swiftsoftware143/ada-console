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
  notes: "",
};

export default function PersonalWebsiteFormModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initialState);
  }, [open]);

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

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      domain: cleanDomain(form.domain),
      plan_tier: form.plan_tier,
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
                <SelectItem value="pro">Pro</SelectItem>
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
