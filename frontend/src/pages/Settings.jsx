import { useCallback, useEffect, useState } from "react";
import { Save, Globe, Building2, Check } from "lucide-react";
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

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cdnData } = await supabase.from("settings").select("value").eq("key", "cdn_domain").maybeSingle();
      if (cdnData?.value) setCdnDomain(cdnData.value);
      const { data: agencyData } = await supabase.from("settings").select("value").eq("key", "agency_name").maybeSingle();
      if (agencyData?.value) setAgencyName(agencyData.value);
      const { data: ctaData } = await supabase.from("settings").select("value").eq("key", "cta_url").maybeSingle();
      if (ctaData?.value) setCtaUrl(ctaData.value);
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
      const { error } = await supabase.from("settings").upsert({ key: "cdn_domain", value: cdnDomain, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("CDN domain updated");
    } catch (e) { toast.error("Failed to save CDN domain"); }
    setSaving(false);
  };

  const handleSaveAgencyDefaults = async () => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "agency_name", value: agencyName, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "cta_url", value: ctaUrl, updated_at: new Date().toISOString() });
      toast.success("Agency defaults saved");
    } catch (e) { toast.error("Failed to save agency defaults"); }
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
    </div>
  );
}
