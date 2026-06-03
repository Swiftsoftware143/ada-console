import { useCallback, useEffect, useState } from "react";
import { Save, Globe, Building2, Check, Tag, Plus, Trash2, Mail, Server, Lock, Eye, EyeOff } from "lucide-react";
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

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cdnDomain, setCdnDomain] = useState(DEFAULT_CDN_DOMAIN);
  const [previewDomain, setPreviewDomain] = useState("clientdomain.com");
  const [agencyName, setAgencyName] = useState(DEFAULT_AGENCY_NAME);
  const [ctaUrl, setCtaUrl] = useState(DEFAULT_CTA_URL);
  
  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cdnData } = await supabase.from("settings").select("value").eq("key", "cdn_domain").maybeSingle();
      if (cdnData?.value) setCdnDomain(cdnData.value);
      const { data: agencyData } = await supabase.from("settings").select("value").eq("key", "agency_name").maybeSingle();
      if (agencyData?.value) setAgencyName(agencyData.value);
      const { data: ctaData } = await supabase.from("settings").select("value").eq("key", "cta_url").maybeSingle();
      if (ctaData?.value) setCtaUrl(ctaData.value);
      
      // Load SMTP settings
      const { data: smtpHostData } = await supabase.from("settings").select("value").eq("key", "smtp_host").maybeSingle();
      if (smtpHostData?.value) setSmtpHost(smtpHostData.value);
      const { data: smtpPortData } = await supabase.from("settings").select("value").eq("key", "smtp_port").maybeSingle();
      if (smtpPortData?.value) setSmtpPort(smtpPortData.value);
      const { data: smtpUserData } = await supabase.from("settings").select("value").eq("key", "smtp_username").maybeSingle();
      if (smtpUserData?.value) setSmtpUsername(smtpUserData.value);
      const { data: smtpPassData } = await supabase.from("settings").select("value").eq("key", "smtp_password").maybeSingle();
      if (smtpPassData?.value) setSmtpPassword(smtpPassData.value);
      const { data: smtpSecureData } = await supabase.from("settings").select("value").eq("key", "smtp_secure").maybeSingle();
      if (smtpSecureData?.value) setSmtpSecure(smtpSecureData.value === "true");
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const generateEmbedPreview = () => {
    return `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js";s.setAttribute("data-domain","${previewDomain}");s.async=!0;document.body.appendChild(s)}();</script>`;
  };

  const handleSaveCdnDomain = async () => {
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
      toast.error("Failed to save CDN domain: " + e.message); 
    }
    setSaving(false);
  };

  const saveSetting = async (key, value) => {
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

  const handleSaveAgencyDefaults = async () => {
    setSaving(true);
    try {
      await saveSetting("agency_name", agencyName);
      await saveSetting("cta_url", ctaUrl);
      toast.success("Agency defaults saved");
    } catch (e) { 
      console.error("Save error:", e);
      toast.error("Failed to save agency defaults: " + e.message); 
    }
    setSaving(false);
  };

  const handleSaveSMTP = async () => {
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

  const setNetlifyUrl = () => setCdnDomain(DEFAULT_CDN_DOMAIN);
  const setCustomUrl = () => setCdnDomain(CUSTOM_CDN_DOMAIN);

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
            <Input value={cdnDomain} onChange={(e) => setCdnDomain(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
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
            <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
          </div>
          <div>
            <Label className="text-[#94a3b8]">Default CTA URL</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="bg-[#0f1117] border-[#2e3245] text-white" />
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
}) {
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
              onChange={(e) => setSmtpHost(e.target.value)} 
              placeholder="smtp.mailgun.org"
              className="bg-[#0f1117] border-[#2e3245] text-white" 
            />
          </div>
          <div>
            <Label className="text-[#94a3b8]">SMTP Port</Label>
            <Input 
              value={smtpPort} 
              onChange={(e) => setSmtpPort(e.target.value)} 
              placeholder="587"
              className="bg-[#0f1117] border-[#2e3245] text-white" 
            />
          </div>
        </div>
        
        <div>
          <Label className="text-[#94a3b8]">SMTP Username</Label>
          <Input 
            value={smtpUsername} 
            onChange={(e) => setSmtpUsername(e.target.value)} 
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
              onChange={(e) => setSmtpPassword(e.target.value)} 
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
            onChange={(e) => setSmtpSecure(e.target.checked)}
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
function TagManagerCard() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
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
          ? data.value.split(',').map(t => t.trim()).filter(Boolean)
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

  const saveTags = async (newTags) => {
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

  const addTag = () => {
    if (!newTag.trim()) return;
    const normalizedTag = newTag.trim();
    // Case-insensitive duplicate check
    const tagExists = tags.some(t => t.toLowerCase() === normalizedTag.toLowerCase());
    if (tagExists) {
      toast.error("Tag already exists");
      return;
    }
    const updated = [...tags, normalizedTag];
    saveTags(updated);
    setNewTag("");
  };

  const deleteTag = (tagToDelete) => {
    const updated = tags.filter(t => t !== tagToDelete);
    saveTags(updated);
  };

  const clearAllTagsFromRecords = async () => {
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
      toast.error('Failed to clear tags: ' + e.message);
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
          {tags.map((tag) => (
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
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
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
