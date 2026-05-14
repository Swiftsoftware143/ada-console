import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
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

export default function ClientDetail({ isPersonal = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categories, setCategories] = useState(["Ecommerce", "Newsletters", "SaaS"]);

  const loadCategories = useCallback(async () => {
    try {
      const [{ data: clients }, { data: websites }] = await Promise.all([
        supabase.from("clients").select("category"),
        supabase.from("personal_websites").select("category"),
      ]);
      const allCats = new Set(["Ecommerce", "Newsletters", "SaaS"]);
      [...(clients || []), ...(websites || [])].forEach(item => {
        if (item.category) allCats.add(item.category);
      });
      setCategories(Array.from(allCats).sort());
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(isPersonal ? "personal_websites" : "clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        toast.error("Client not found");
        navigate("/clients");
        return;
      }
      setClient(hydrate(data));
      loadCategories(); // Load categories in background
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate, isPersonal, loadCategories]);

  const update = useCallback(
    (patch) => setClient((c) => ({ ...c, ...patch })),
    []
  );
  const updateProfile = useCallback(
    (key, val) =>
      setClient((c) => ({
        ...c,
        enabled_profiles: { ...c.enabled_profiles, [key]: val },
      })),
    []
  );
  const updateFeature = useCallback(
    (key, val) =>
      setClient((c) => ({
        ...c,
        enabled_features: { ...c.enabled_features, [key]: val },
      })),
    []
  );

  const embedCode = useMemo(
    () => generateEmbedCode(client?.domain),
    [client?.domain]
  );

  const handleSave = async () => {
    if (!client) return;
    if (!client.name?.trim()) return toast.error("Client name is required");
    if (!client.domain?.trim()) return toast.error("Domain is required");

    setSaving(true);
    const payload = {
      name: client.name.trim(),
      domain: cleanDomain(client.domain),
      plan_tier: client.plan_tier,
      category: client.category?.trim() || null,
      location: client.location?.trim() || null,
      notes: client.notes?.trim() || null,
      active: client.active,
      widget_position: client.widget_position,
      primary_color: client.primary_color,
      enabled_profiles: client.enabled_profiles,
      enabled_features: client.enabled_features,
    };
    const { data, error } = await supabase
      .from(isPersonal ? "personal_websites" : "clients")
      .update(payload)
      .eq("id", client.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      console.error("Save error:", error);
      if (error.code === "23505") toast.error("Another client already uses this domain");
      else toast.error(error.message || "Failed to save");
      return;
    }
    console.log("Save response:", data);
    setClient(hydrate(data));
      loadCategories();
    toast.success("Changes saved");
  };

  const handleToggleActive = async (val) => {
    update({ active: val });
    const { error } = await supabase
      .from(isPersonal ? "personal_websites" : "clients")
      .update({ active: val })
      .eq("id", client.id);
    if (error) {
      toast.error("Failed to update widget status");
      update({ active: !val });
      return;
    }
    toast.success(val ? "Widget activated" : "Widget deactivated");
  };

  const handleDelete = async () => {
    const { error } = await supabase.from(isPersonal ? "personal_websites" : "clients").delete().eq("id", client.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success(`${client.name} deleted`);
    navigate("/clients");
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#64748b] text-sm" data-testid="detail-loading">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading client...
      </div>
    );
  }

  return (
    <div data-testid="client-detail-page" className="pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={isPersonal ? "/personal-websites" : "/clients"}
          data-testid="back-to-clients-link"
          className="inline-flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Link>
        <Button
          variant="ghost"
          data-testid="header-delete-btn"
          onClick={() => setDeleteOpen(true)}
          className="text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete client
        </Button>
      </div>

      {/* Master toggle hero */}
      <MasterStatusHero
        name={client.name}
        domain={client.domain}
        active={client.active}
        onToggle={handleToggleActive}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details + toggles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Client Info */}
          <Section title="Client Info" testId="section-client-info">
            <Field label="Name">
              <Input
                data-testid="field-name"
                value={client.name}
                onChange={(e) => update({ name: e.target.value })}
                className="bg-[#0f1117] border-[#2e3245] text-white focus-visible:ring-[#007bff] focus-visible:border-transparent"
              />
            </Field>
            <Field label="Domain">
              <Input
                data-testid="field-domain"
                value={client.domain}
                onChange={(e) => update({ domain: e.target.value })}
                className="bg-[#0f1117] border-[#2e3245] text-white focus-visible:ring-[#007bff] focus-visible:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-[#64748b] mt-1.5">
                Stored cleanly on save (no https://, www., or trailing /).
              </p>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <Input
                  data-testid="field-category"
                  value={client.category || ""}
                  onChange={(e) => update({ category: e.target.value })}
                  placeholder="Type new or existing category..."
                  list="category-suggestions"
                  className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
                />
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </Field>
              <Field label="Location">
                <Input
                  data-testid="field-location"
                  value={client.location || ""}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="City, State"
                  className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
                />
              </Field>
            </div>
            <Field label="Plan Tier">
              <Select
                value={client.plan_tier}
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
            <Field label="Internal Notes">
              <Textarea
                data-testid="field-notes"
                value={client.notes || ""}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
                placeholder="Anything your team should know about this client..."
                className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent resize-none"
              />
            </Field>
          </Section>

          {/* Section 2: Widget Settings */}
          <Section title="Widget Settings" testId="section-widget-settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Widget Position">
                <Select
                  value={client.widget_position}
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
                      value={client.primary_color}
                      onChange={(e) => update({ primary_color: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                  <Input
                    data-testid="field-primary-color-hex"
                    value={client.primary_color}
                    onChange={(e) => update({ primary_color: e.target.value })}
                    className="bg-[#0f1117] border-[#2e3245] text-white font-mono text-sm focus-visible:ring-[#007bff] focus-visible:border-transparent flex-1"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Section 3: Profiles */}
          <Section title="Default Profiles" testId="section-profiles" subtitle="Select which profile buttons appear in the widget. All features start OFF.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PROFILE_LABELS).map(([key, label]) => (
                <ToggleRow
                  key={key}
                  label={label}
                  testId={`profile-${key}`}
                  checked={!!client.enabled_profiles[key]}
                  onChange={(v) => updateProfile(key, v)}
                />
              ))}
            </div>
          </Section>

          {/* Section 4: Features */}
          <Section title="Default Features" testId="section-features" subtitle="Select which feature buttons appear in the widget. All features start OFF.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <ToggleRow
                  key={key}
                  label={label}
                  testId={`feature-${key}`}
                  checked={!!client.enabled_features[key]}
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
              Drop into the {client.domain || "client"} {"<body>"}
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
        clientName={client.name}
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
