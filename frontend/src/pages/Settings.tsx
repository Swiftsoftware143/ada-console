import { useCallback, useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import { Save, Globe, Building2, Tag, Plus, Trash2, Mail, Server, Eye, EyeOff } from "lucide-react";
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

interface SMTPSettingsCardProps {
  smtpHost: string;
  setSmtpHost: (value: string) => void;
  smtpPort: string;
  setSmtpPort: (value: string) => void;
  smtpUsername: string;
  setSmtpUsername: (value: string) => void;
  smtpPassword: string;
  setSmtpPassword: (value: string) => void;
  smtpSecure: boolean;
  setSmtpSecure: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
}

export default function Settings(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [cdnDomain, setCdnDomain] = useState<string>(DEFAULT_CDN_DOMAIN);
  const [previewDomain, setPreviewDomain] = useState<string>("clientdomain.com");
  const [agencyName, setAgencyName] = useState<string>(DEFAULT_AGENCY_NAME);
  const [ctaUrl, setCtaUrl] = useState<string>(DEFAULT_CTA_URL);
  
  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState<string>("");
  const [smtpPort, setSmtpPort] = useState<string>("587");
  const [smtpUsername, setSmtpUsername] = useState<string>("");
  const [smtpPassword, setSmtpPassword] = useState<string>("");
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data: cdnData } = await supabase.from("settings").select("value").eq("key", "cdn_domain").maybeSingle();
      if (cdnData?.value) setCdnDomain(cdnData.value as string);
      const { data: agencyData } = await supabase.from("settings").select("value").eq("key", "agency_name").maybeSingle();
      if (agencyData?.value) setAgencyName(agencyData.value as string);
      const { data: ctaData } = await supabase.from("settings").select("value").eq("key", "cta_url").maybeSingle();
      if (ctaData?.value) setCtaUrl(ctaData.value as string);
      
      // Load SMTP settings
      const { data: smtpHostData } = await supabase.from("settings").select("value").eq("key", "smtp_host").maybeSingle();
      if (smtpHostData?.value) setSmtpHost(smtpHostData.value as string);
      const { data: smtpPortData } = await supabase.from("settings").select("value").eq("key", "smtp_port").maybeSingle();
      if (smtpPortData?.value) setSmtpPort(smtpPortData.value as string);
      const { data: smtpUserData } = await supabase.from("settings").select("value").eq("key", "smtp_username").maybeSingle();
      if (smtpUserData?.value) setSmtpUsername(smtpUserData.value as string);
      const { data: smtpPassData } = await supabase.from("settings").select("value").eq("key", "smtp_password").maybeSingle();
      if (smtpPassData?.value) setSmtpPassword(smtpPassData.value as string);
      const { data: smtpSecureData } = await supabase.from("settings").select("value").eq("key", "smtp_secure").maybeSingle();
      if (smtpSecureData?.value) setSmtpSecure(smtpSecureData.value === "true");
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const generateEmbedPreview = (): string => {
    return `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js";s.setAttribute("data-domain","${previewDomain}");s.async=!0;document.body.appendChild(s)}();</script>`;
  };

  const handleSaveCdnDomain = async (): Promise<void> => {
    setSaving(true);
    try {
      // Try update first
      const { error: updateError } = await supabase
        .from("settings")
        .update({ value: cdnDomain, updated_at: new Date().toISOString() })
        .eq("key", "cdn_domain");
      
      if (updateError) {
        console.log("Update failed, trying insert:", updateError);
        // If update fails (no row exists), insert
        const { error: insertError } = await supabase
          .from("settings")
          .insert({ key: "cdn_domain", value: cdnDomain, updated_at: new Date().toISOString() });
        if (insertError) throw insertError;
      }
      
      toast.success("CDN domain updated");
    } catch (e) { 
      console.error("Save error:", e);
      toast.error("Failed to save CDN domain: " + (e as Error).message); 
    }
    setSaving(false);
  };

  const saveSetting = async (key: string, value: string): Promise<void> => {
    // Try update first
    const { error: updateError } = await supabase
      .from("settings")
      .update({ value: value, updated_at: new Date().toISOString() })
      .eq("key", key);
    
    if (updateError) {
      // If update fails (no row exists), insert
      const { error: insertError } = await supabase
        .from("settings")
        .insert({ key: key, value: value, updated_at: new Date().toISOString() });
      if (insertError) throw insertError;
    }
  };

  const handleSaveAgencyDefaults = async (): Promise<void> => {
    setSaving(true);
    try {
      await saveSetting("agency_name", agencyName);
      await saveSetting("cta_url", ctaUrl);
      toast.success("Agency defaults saved");
    } catch (e) { 
      console.error("Save error:", e);
      toast.error("Failed to save agency defaults: " + (e as Error).message); 
    }
    setSaving(false);
  };

  const handleSaveSMTP = async (): Promise<void> => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "smtp_host", value: smtpHost, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "smtp_port", value: smtpPort, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "smtp_username", value: smtpUsername, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "smtp_password", value: smtpPassword, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "smtp_secure", value: smtpSecure ? "true" : "false", updated_at: new Date().toISOString() });
      toast.success("SMTP settings saved!");
    } catch (e) { 
      toast.error("Failed to save SMTP settings");
    }
    setSaving(false);
  };

  const setNetlifyUrl = (): void => setCdnDomain(DEFAULT_CDN_DOMAIN);
  const setCustomUrl = (): void => setCdnDomain(CUSTOM_CDN_DOMAIN);

  if (loading) return <div className="p-6 text-[#64748b]">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="Console Settings" subtitle="Manage your ADA console configuration" />
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
            <Input value={cdnDomain} onChange={(e: ChangeEvent<HTMLInputElement>) => setCdnDomain(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={setNetlifyUrl} className="border-[#2e3245] text-[#94a3b8]">Use Netlify URL</Button>
            <Button variant="outline" onClick={setCustomUrl} className="border-[#2e3245] text-[#94a3b8]">Use Custom Domain</Button>
          </div>
          <div>
            <Label className="text-[#94a3b8]">Live Preview</Label>
            <div className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4">
              <code className="block text-xs text-[#94a3b8] font-mono break-all">{generateEmbedPreview()}</code>
            </div>
          </div>
          <Button onClick={handleSaveCdnDomain} disabled={saving} className="bg-[#007bff]">{saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save</>}</Button>
        </CardContent>
      </Card>
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
            <Input value={agencyName} onChange={(e: ChangeEvent<HTMLInputElement>) => setAgencyName(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <div>
            <Label className="text-[#94a3b8]">Default CTA URL</Label>
            <Input value={ctaUrl} onChange={(e: ChangeEvent<HTMLInputElement>) => setCtaUrl(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <Button onClick={handleSaveAgencyDefaults} disabled={saving} className="bg-[#007bff]">{saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Agency Defaults</>}</Button>
        </CardContent>
      </Card>
      
      <SMTPSettingsCard 
        smtpHost={smtpHost}
        setSmtpHost={setSmtpHost}
        smtpPort={smtpPort}
        setSmtpPort={setSmtpPort}
        smtpUsername={smtpUsername}
        setSmtpUsername={setSmtpUsername}
        smtpPassword={smtpPassword}
        setSmtpPassword={setSmtpPassword}
        smtpSecure={smtpSecure}
        setSmtpSecure={setSmtpSecure}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        saving={saving}
        onSave={handleSaveSMTP}
      />
      
      <TagManagerCard />
    </div>
  );
}

// SMTP Settings Component
function SMTPSettingsCard({ 
  smtpHost, setSmtpHost, 
  smtpPort, setSmtpPort, 
  smtpUsername, setSmtpUsername, 
  smtpPassword, setSmtpPassword, 
  smtpSecure, setSmtpSecure,
  showPassword, setShowPassword,
  saving, onSave 
}: SMTPSettingsCardProps): JSX.Element {
  return (
    <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Server className="h-5 w-5 text-[#007bff]" />
          SMTP Configuration
        </CardTitle>
        <CardDescription className="text-[#94a3b8]">
          Configure your Mailgun or other SMTP provider for sending widget delivery emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#94a3b8]">SMTP Host</Label>
            <Input 
              value={smtpHost} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSmtpHost(e.target.value)} 
              placeholder="smtp.mailgun.org"
              className="bg-[#0f1117] border-[#2e3245] text-white" 
            />
          </div>
          <div>
            <Label className="text-[#94a3b8]">SMTP Port</Label>
            <Input 
              value={smtpPort} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSmtpPort(e.target.value)} 
              placeholder="587"
              className="bg-[#0f1117] border-[#2e3245] text-white" 
            />
          </div>
        </div>
        
        <div>
          <Label className="text-[#94a3b8]">SMTP Username</Label>
          <Input 
            value={smtpUsername} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSmtpUsername(e.target.value)} 
            placeholder="postmaster@yourdomain.com"
            className="bg-[#0f1117] border-[#2e3245] text-white" 
          />
        </div>
        
        <div>
          <Label className="text-[#94a3b8]">SMTP Password / API Key</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"}
              value={smtpPassword} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSmtpPassword(e.target.value)} 
              placeholder="your-smtp-password-or-api-key"
              className="bg-[#0f1117] border-[#2e3245] text-white pr-10" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smtp_secure"
            checked={smtpSecure}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSmtpSecure(e.target.checked)}
            className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#4ade80]"
          />
          <Label htmlFor="smtp_secure" className="cursor-pointer text-[#e2e8f0]">
            Use SSL/TLS (Port 465)
          </Label>
          <span className="text-[#64748b] text-xs">
            (Uncheck for STARTTLS on port 587)
          </span>
        </div>
        
        <div className="bg-[#0f1117] rounded-lg p-4 border border-[#2e3245]">
          <p className="text-[#64748b] text-xs mb-2">Mailgun Example:</p>
          <ul className="text-[#94a3b8] text-xs space-y-1">
            <li>• Host: smtp.mailgun.org</li>
            <li>• Port: 587 (or 465 for SSL)</li>
            <li>• Username: postmaster@yourdomain.com</li>
            <li>• Password: Your Mailgun SMTP password</li>
          </ul>
        </div>
        
        <Button onClick={onSave} disabled={saving} className="bg-[#007bff]">
          <Mail className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save SMTP Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Tag Manager Component
function TagManagerCard(): JSX.Element {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async (): Promise<void> => {
    setLoading(true);
    try {
      // Load from settings
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "tags")
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.value) {
        const parsed = typeof data.value === 'string' 
          ? data.value.split(',').map((t: string) => t.trim()).filter(Boolean)
          : Array.isArray(data.value) ? data.value : [];
        setTags(parsed);
      } else {
        // Default tags
        setTags(["Medical", "Local Business", "E-commerce", "Professional Services", "Non-Profit", "Enterprise", "Basic Plan", "Pro Plan"]);
      }
    } catch (e) {
      console.error("Error loading tags:", e);
      toast.error("Failed to load tags");
    }
    setLoading(false);
  };

  const saveTags = async (newTags: string[]): Promise<void> => {
    setSaving(true);
    try {
      // Try update first, then insert if not exists
      const { error: updateError } = await supabase
        .from("settings")
        .update({ 
          value: newTags.join(", "),
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
            value: newTags.join(", "),
            updated_at: new Date().toISOString() 
          });
        if (insertError) throw insertError;
      }
      
      setTags(newTags);
      toast.success("Tags saved");
    } catch (e) {
      console.error("Error saving tags:", e);
      toast.error("Failed to save tags");
    }
    setSaving(false);
  };

  const addTag = (): void => {
    if (!newTag.trim()) return;
    const normalizedTag = newTag.trim();
    // Case-insensitive duplicate check
    const tagExists = tags.some((t: string) => t.toLowerCase() === normalizedTag.toLowerCase());
    if (tagExists) {
      toast.error("Tag already exists");
      return;
    }
    const updated = [...tags, normalizedTag];
    saveTags(updated);
    setNewTag("");
  };

  const deleteTag = (tagToDelete: string): void => {
    const updated = tags.filter((t: string) => t !== tagToDelete);
    saveTags(updated);
  };

  const clearAllTagsFromRecords = async (): Promise<void> => {
    if (!window.confirm('WARNING: This will remove ALL tags from ALL clients and websites.\n\nAre you sure?')) return;
    
    setClearing(true);
    try {
      // Clear tags from clients
      const { error: clientsError } = await supabase
        .from('clients')
        .update({ tags: null })
        .neq('tags', null);
      
      if (clientsError) throw clientsError;
      
      // Clear tags from personal_websites
      const { error: websitesError } = await supabase
        .from('personal_websites')
        .update({ tags: null })
        .neq('tags', null);
      
      if (websitesError) throw websitesError;
      
      toast.success('All tags cleared from clients and websites');
    } catch (e) {
      console.error('Error clearing tags:', e);
      toast.error('Failed to clear tags: ' + (e as Error).message);
    }
    setClearing(false);
  };

  if (loading) return (
    <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
      <CardContent className="p-6 text-[#64748b]">Loading tags...</CardContent>
    </Card>
  );

  return (
    <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Tag className="h-5 w-5 text-[#007bff]" />
          Tag Manager
        </CardTitle>
        <CardDescription className="text-[#94a3b8]">
          Manage tags for filtering Clients and Personal Websites. Clients can have multiple tags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
            <span 
              key={tag} 
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#007bff]/20 text-[#007bff] rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => deleteTag(tag)}
                className="hover:text-white ml-1"
                title="Delete tag"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="New tag name..."
            className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b]"
          />
          <Button 
            onClick={addTag} 
            disabled={saving || !newTag.trim()}
            className="bg-[#007bff]"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        
        <p className="text-xs text-[#64748b]">
          Tags work like labels — assign multiple tags to each client for flexible filtering. Delete unused tags anytime.
        </p>
        
        <div className="pt-4 border-t border-[#2e3245]">
          <Button 
            onClick={clearAllTagsFromRecords} 
            disabled={clearing}
            variant="outline"
            className="border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearing ? 'Clearing...' : 'Clear All Tags from All Records'}
          </Button>
          <p className="text-xs text-[#64748b] mt-2">
            Removes all tags from every client and website. Use this to start fresh.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
