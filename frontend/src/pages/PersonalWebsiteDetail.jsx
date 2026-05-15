import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2, Tag, Search, X } from "lucide-react";
import {
  supabase,
  PROFILE_LABELS,
  FEATURE_LABELS,
  DEFAULT_PROFILES,
  DEFAULT_FEATURES,
} from "@/lib/supabase";
import { cleanDomain, generateEmbedCode } from "@/lib/helpers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MasterStatusHero from "@/components/MasterStatusHero";
import EmbedCodeBlock from "@/components/EmbedCodeBlock";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

const hydrate = (data) => ({
  ...data,
  enabled_profiles: { ...DEFAULT_PROFILES, ...(data.enabled_profiles || {}) },
  enabled_features: { ...DEFAULT_FEATURES, ...(data.enabled_features || {}) },
});

export default function PersonalWebsiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [profileFilter, setProfileFilter] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");

  const loadTags = useCallback(async () => {
    try {
      // Load from settings first
      const { data: settingsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "tags")
        .maybeSingle();
      
      const allTags = new Set();
      
      if (settingsData?.value) {
        const parsed = typeof settingsData.value === 'string'
          ? settingsData.value.split(',').map(t => t.trim()).filter(Boolean)
          : Array.isArray(settingsData.value) ? settingsData.value : [];
        parsed.forEach(t => allTags.add(t));
      }
      
      // Also load from existing clients/websites
      const [{ data: clients }, { data: websites }] = await Promise.all([
        supabase.from("clients").select("tags"),
        supabase.from("personal_websites").select("tags"),
      ]);
      
      [...(clients || []), ...(websites || [])].forEach(item => {
        if (item.tags) {
          if (typeof item.tags === 'string') {
            item.tags.split(',').forEach(t => allTags.add(t.trim()));
          } else if (Array.isArray(item.tags)) {
            item.tags.forEach(t => allTags.add(t));
          }
        }
      });
      
      setAvailableTags(Array.from(allTags).sort());
    } catch (err) {
      console.error("Error loading tags:", err);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("personal_websites")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        toast.error("Website not found");
        navigate("/personal-websites");
        return;
      }
      setWebsite(hydrate(data));
      loadTags();
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate, loadTags]);

  const update = useCallback(
    (patch) => setWebsite((w) => ({ ...w, ...patch })),
    []
  );
  const updateProfile = useCallback(
    (key, val) =>
      setWebsite((w) => ({
        ...w,
        enabled_profiles: { ...w.enabled_profiles, [key]: val },
      })),
    []
  );
  const updateFeature = useCallback(
    (key, val) =>
      setWebsite((w) => ({
        ...w,
        enabled_features: { ...w.enabled_features, [key]: val },
      })),
    []
  );

  const handleSave = useCallback(async () => {
    if (!website) return;
    setSaving(true);
    const { id: _id, created_at, updated_at, ...rest } = website;
    const { error } = await supabase
      .from("personal_websites")
      .update({ ...rest, domain: cleanDomain(rest.domain) })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Failed to save");
      return;
    }
    toast.success("Saved successfully");
  }, [website, id]);

  const handleDelete = useCallback(async () => {
    const { error } = await supabase
      .from("personal_websites")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    navigate("/personal-websites");
  }, [id, navigate]);

  const handleToggleActive = useCallback(async () => {
    if (!website) return;
    const newVal = !website.active;
    update({ active: newVal });
    const { error } = await supabase
      .from("personal_websites")
      .update({ active: newVal })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      update({ active: !newVal });
      return;
    }
    toast.success(newVal ? "Activated" : "Deactivated");
  }, [website, id, update]);

  const embedCode = useMemo(
    () => generateEmbedCode(website?.domain),
    [website?.domain]
  );

  if (loading || !website) {
    return (
      <div data-testid="website-detail-loading" className="p-10 text-center text-[#64748b]">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading...
      </div>
    );
  }

  // Helper to get current tags array
  const getCurrentTags = () => {
    if (!website.tags) return [];
    if (typeof website.tags === 'string') {
      return website.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (Array.isArray(website.tags)) return website.tags;
    return [];
  };

  // Helper to add a tag
  const addTag = (tag) => {
    const current = getCurrentTags();
    if (!current.includes(tag)) {
      update({ tags: [...current, tag].join(', ') });
    }
  };

  // Helper to remove a tag
  const removeTag = (idx) => {
    const current = getCurrentTags();
    const newTags = current.filter((_, i) => i !== idx);
    update({ tags: newTags.join(', ') });
  };

  return (
    <div data-testid="website-detail-page" className="pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/personal-websites"
          data-testid="back-to-websites-link"
          className="inline-flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to websites
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            data-testid="header-delete-btn"
            onClick={() => setDeleteOpen(true)}
            className="text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete website
          </Button>
        </div>
      </div>

      {/* Master toggle hero */}
      <MasterStatusHero
        name={website.name}
        domain={website.domain}
        active={website.active}
        onToggle={handleToggleActive}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details + toggles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Website Info */}
          <Section title="Website Info" testId="section-website-info">
            <Field label="Name">
              <Input
                data-testid="field-name"
                value={website.name}
                onChange={(e) => update({ name: e.target.value })}
                className="bg-[#0f1117] border-[#2e3245] text-white focus-visible:ring-[#007bff] focus-visible:border-transparent"
              />
            </Field>
            <Field label="Domain">
              <Input
                data-testid="field-domain"
                value={website.domain}
                onChange={(e) => update({ domain: e.target.value })}
                className="bg-[#0f1117] border-[#2e3245] text-white focus-visible:ring-[#007bff] focus-visible:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-[#64748b] mt-1.5">
                Stored cleanly on save (no https://, www., or trailing /).
              </p>
            </Field>
            
            {/* Tags Field */}
            <Field label="Tags">
              <div className="flex flex-wrap gap-2 mb-2">
                {getCurrentTags().map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#007bff]/20 text-[#007bff] rounded text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Quick-add from existing tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {availableTags
                  .filter(t => !getCurrentTags().includes(t))
                  .slice(0, 8)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
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
                      if (tagInput.trim()) {
                        addTag(tagInput.trim());
                        setTagInput("");
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
                    if (tagInput.trim()) {
                      addTag(tagInput.trim());
                      setTagInput("");
                    }
                  }}
                  className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27]"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-[#64748b] mt-1">
                Click quick tags or type custom. Manage all tags in Settings → Tag Manager.
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Location">
                <Input
                  data-testid="field-location"
                  value={website.location || ""}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="City, State"
                  className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
                />
              </Field>
              <Field label="Plan Tier">
                <Select
                  value={website.plan_tier}
                  onValueChange={(v) => update({ plan_tier: v })}
                >
                  <SelectTrigger
                    data-testid="field-plan-trigger"
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
              </Field>
            </div>
            <Field label="Internal Notes">
              <Textarea
                data-testid="field-notes"
                value={website.notes || ""}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
                placeholder="Anything your team should know about this website..."
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent resize-none"
              />
            </Field>
          </Section>

          {/* Section 2: Widget Settings */}
          <Section title="Widget Settings" testId="section-widget-settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Widget Position">
                <Select
                  value={website.widget_position}
                  onValueChange={(v) => update({ widget_position: v })}
                >
                  <SelectTrigger
                    data-testid="field-position-trigger"
                    className="bg-[#0f1117] border-[#2e3245] text-white focus:ring-[#007bff]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2130] border-[#2e3245] text-white">
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Primary Color">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-12 rounded-md border border-[#2e3245] overflow-hidden">
                    <input
                      type="color"
                      data-testid="field-primary-color"
                      value={website.primary_color}
                      onChange={(e) => update({ primary_color: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                  <Input
                    data-testid="field-primary-color-hex"
                    value={website.primary_color}
                    onChange={(e) => update({ primary_color: e.target.value })}
                    className="bg-[#0f1117] border-[#2e3245] text-white font-mono text-sm focus-visible:ring-[#007bff] focus-visible:border-transparent flex-1"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Section 3: Profiles */}
          <Section title="Default Profiles" testId="section-profiles" subtitle="Select which profile buttons appear in the widget. All features start OFF.">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  value={profileFilter}
                  onChange={(e) => setProfileFilter(e.target.value)}
                  placeholder="Filter profiles..."
                  className="pl-9 pr-9 bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
                />
                {profileFilter && (
                  <button
                    onClick={() => setProfileFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PROFILE_LABELS)
                .filter(([key, label]) =>
                  label.toLowerCase().includes(profileFilter.toLowerCase()) ||
                  key.toLowerCase().includes(profileFilter.toLowerCase())
                )
                .map(([key, label]) => (
                  <ToggleRow
                    key={key}
                    label={label}
                    testId={`profile-${key}`}
                    checked={!!website.enabled_profiles[key]}
                    onChange={(v) => updateProfile(key, v)}
                  />
                ))}
            </div>
          </Section>

          {/* Section 4: Features */}
          <Section title="Default Features" testId="section-features" subtitle="Select which feature buttons appear in the widget. All features start OFF.">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  value={featureFilter}
                  onChange={(e) => setFeatureFilter(e.target.value)}
                  placeholder="Filter features..."
                  className="pl-9 pr-9 bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
                />
                {featureFilter && (
                  <button
                    onClick={() => setFeatureFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(FEATURE_LABELS)
                .filter(([key, label]) =>
                  label.toLowerCase().includes(featureFilter.toLowerCase()) ||
                  key.toLowerCase().includes(featureFilter.toLowerCase())
                )
                .map(([key, label]) => (
                  <ToggleRow
                    key={key}
                    label={label}
                    testId={`feature-${key}`}
                    checked={!!website.enabled_features[key]}
                    onChange={(v) => updateFeature(key, v)}
                  />
                ))}
            </div>
          </Section>
        </div>

        {/* Right column: Embed code + Save */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-6 lg:sticky lg:top-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#64748b] font-bold mb-2">
              Embed Snippet
            </div>
            <h3
              className="text-lg font-semibold text-white tracking-tight mb-3"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Drop into the {website.domain || "website"} {"<body>"}
            </h3>
            <EmbedCodeBlock code={embedCode} testId="detail-embed-block" />
            <p className="text-xs text-[#64748b] mt-3">
              Auto-updates as you change the domain field above.
            </p>
          </div>

          <Button
            data-testid="save-changes-btn"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)] hover:shadow-[0_0_22px_rgba(0,123,255,0.45)] transition-shadow h-11 text-base"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save changes
              </>
            )}
          </Button>
        </aside>
      </div>

      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        clientName={website.name}
      />
    </div>
  );
}

function Section({ title, subtitle, children, testId }) {
  return (
    <section data-testid={testId} className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-6">
      <div className="mb-5">
        <h2
          className="text-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {title}
        </h2>
        {subtitle && <p className="text-xs text-[#64748b] mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.15em] text-[#64748b] font-bold">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, testId }) {
  return (
    <label
      className="flex items-center justify-between gap-3 bg-[#0f1117] border border-[#2e3245] hover:border-[#3e445e] rounded-lg px-4 py-3 cursor-pointer transition-colors"
    >
      <span className="text-sm text-white font-medium">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        data-testid={testId}
        className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-[#2e3245]"
      />
    </label>
  );
}
