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
  
  // CDN Domain settings
  const [cdnDomain, setCdnDomain] = useState(DEFAULT_CDN_DOMAIN);
  const [previewDomain, setPreviewDomain] = useState("clientdomain.com");
  
  // Agency defaults
  const [agencyName, setAgencyName] = useState(DEFAULT_AGENCY_NAME);
  const [ctaUrl, setCtaUrl] = useState(DEFAULT_CTA_URL);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Load CDN domain
      const { data: cdnData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "cdn_domain")
        .maybeSingle();
      
      if (cdnData?.value) {
        setCdnDomain(cdnData.value);
      }

      // Load agency defaults (these could also be stored in settings table)
      const { data: agencyData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "agency_name")
        .maybeSingle();
      
      if (agencyData?.value) {
        setAgencyName(agencyData.value);
      }

      const { data: ctaData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "cta_url")
        .maybeSingle();
      
      if (ctaData?.value) {
        setCtaUrl(ctaData.value);
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const generateEmbedPreview = () => {
    return `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js";s.setAttribute("data-domain","${previewDomain}");s.async=!0;document.body.appendChild(s)}();</script>`;
  };

  const handleSaveCdnDomain = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "cdn_domain", value: cdnDomain, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast.success("CDN domain updated — all embed snippets now reflect the new URL");
    } catch (e) {
      toast.error("Failed to save CDN domain");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgencyDefaults = async () => {
    setSaving(true);
    try {
      const { error: agencyError } = await supabase
        .from("settings")
        .upsert({ key: "agency_name", value: agencyName, updated_at: new Date().toISOString() });

      const { error: ctaError } = await supabase
        .from("settings")
        .upsert({ key: "cta_url", value: ctaUrl, updated_at: new Date().toISOString() });

      if (agencyError || ctaError) throw agencyError || ctaError;

      toast.success("Agency defaults saved successfully");
    } catch (e) {
      toast.error("Failed to save agency defaults");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const setNetlifyUrl = () => setCdnDomain(DEFAULT_CDN_DOMAIN);
  const setCustomUrl = () => setCdnDomain(CUSTOM_CDN_DOMAIN);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Console Settings" subtitle="Manage your ADA console configuration" />
        <div className="mt-6 text-[#64748b]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="Console Settings" subtitle="Manage your ADA console configuration" />

      {/* CDN Domain Section */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-[#007bff]" />
            Loader Script Domain
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Control which domain serves the ADA loader script to all clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cdn-domain" className="text-[#94a3b8]">
              CDN Domain URL
            </Label>
            <Input
              id="cdn-domain"
              value={cdnDomain}
              onChange={(e) => setCdnDomain(e.target.value)}
              placeholder="https://adaswift.netlify.app"
              className="bg-[#0f1117] border-[#2e3245] text-white"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={setNetlifyUrl}
              className="border-[#2e3245] text-[#94a3b8] hover:text-white hover:bg-[#1e2130]"
            >
              Use Netlify URL
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={setCustomUrl}
              className="border-[#2e3245] text-[#94a3b8] hover:text-white hover:bg-[#1e2130]"
            >
              Use Custom Domain
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[#94a3b8]">Live Preview</Label>
            <div className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4">
              <div className="text-xs text-[#64748b] mb-2">
                Preview domain: 
                <Input
                  value={previewDomain}
                  onChange={(e) => setPreviewDomain(e.target.value)}
                  className="inline-block w-48 ml-2 bg-[#1e2130] border-[#2e3245] text-white text-xs h-7"
                />
              </div>
              <code className="block text-xs text-[#94a3b8] font-mono break-all">
                {generateEmbedPreview()}
              </code>
            </div>
          </div>

          <Button
            onClick={handleSaveCdnDomain}
            disabled={saving}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Agency Defaults Section */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-[#007bff]" />
            Agency Defaults
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Default values for new clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agency-name" className="text-[#94a3b8]">
              Default Agency Name
            </Label>
            <Input
              id="agency-name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="SwiftImpact Solutions"
              className="bg-[#0f1117] border-[#2e3245] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-url" className="text-[#94a3b8]">
              Default CTA URL
            </Label>
            <Input
              id="cta-url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://swiftimpactsolutions.com/ada"
              className="bg-[#0f1117] border-[#2e3245] text-white"
            />
          </div>

          <Button
            onClick={handleSaveAgencyDefaults}
            disabled={saving}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Agency Defaults
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
