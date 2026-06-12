import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { Mail, Save, Eye, Code, Type, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";

const DEFAULT_SUBJECT = "Your ADA Widget is Ready - {{business_name}}";

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#4ade80;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
    <h1>🚀 ADA Swift</h1><p>Your Widget is Ready!</p>
  </div>
  <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
    <p>Hi {{contact_name}},</p>
    <p>Your ADA compliance widget for <strong>{{domain}}</strong> is ready!</p>
    <p><strong>Plan:</strong> {{plan_tier}}<br>
    <strong>Widget ID:</strong> {{widget_id}}</p>
    <h3>Your Embed Code:</h3>
    <div style="background:#1e293b;color:#4ade80;padding:15px;border-radius:4px;font-family:monospace;font-size:13px;overflow-x:auto;">{{{embed_code}}}</div>
    <p><strong>Installation:</strong></p>
    <ol><li>Copy the code above</li><li>Paste before the &lt;/body&gt; tag on your website</li><li>Save and publish</li></ol>
    <p>Need help? Reply to this email.</p>
    <p>Best,<br>{{agency_name}} Team</p>
  </div>
</body>
</html>`;

const DEFAULT_TEXT_TEMPLATE = `Hi {{contact_name}},

Your ADA compliance widget for {{domain}} is ready!

Plan: {{plan_tier}}
Widget ID: {{widget_id}}

EMBED CODE:
{{embed_code}}

Installation:
1. Copy the code above
2. Paste before </body> tag on your website
3. Save and publish

Need help? Reply to this email.

Best,
{{agency_name}} Team`;

interface Variable {
  key: string;
  description: string;
}

const AVAILABLE_VARIABLES: Variable[] = [
  { key: "{{business_name}}", description: "Business/company name" },
  { key: "{{contact_name}}", description: "Contact person's name" },
  { key: "{{contact_email}}", description: "Contact email address" },
  { key: "{{domain}}", description: "Website domain" },
  { key: "{{plan_tier}}", description: "Plan tier (Basic/Pro/Enterprise)" },
  { key: "{{widget_id}}", description: "Unique widget ID" },
  { key: "{{embed_code}}", description: "Full embed code (HTML escaped in HTML mode)" },
  { key: "{{agency_name}}", description: "Your agency name from settings" },
];

interface PreviewData {
  business_name: string;
  contact_name: string;
  contact_email: string;
  domain: string;
  plan_tier: string;
  widget_id: string;
  embed_code: string;
  agency_name: string;
}

export default function EmailTemplates(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>(DEFAULT_SUBJECT);
  const [htmlTemplate, setHtmlTemplate] = useState<string>(DEFAULT_HTML_TEMPLATE);
  const [textTemplate, setTextTemplate] = useState<string>(DEFAULT_TEXT_TEMPLATE);
  const [fromEmail, setFromEmail] = useState<string>("hello@swiftimpactsolutions.com");
  const [fromName, setFromName] = useState<string>("SwiftImpact Solutions");
  const [previewData, setPreviewData] = useState<PreviewData>({
    business_name: "Acme Corporation",
    contact_name: "John Doe",
    contact_email: "john@acme.com",
    domain: "acme.com",
    plan_tier: "Pro",
    widget_id: "abc123-def456-ghi789",
    embed_code: '<script>!function(){var s=document.createElement("script");s.src="https://adaswift.netlify.app/loader.js";s.setAttribute("data-domain","acme.com");s.async=!0;document.body.appendChild(s)}();</script>',
    agency_name: "SwiftImpact Solutions",
  });

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data: subjectData } = await supabase.from("settings").select("value").eq("key", "email_subject").maybeSingle();
      if (subjectData?.value) setSubject(subjectData.value as string);
      
      const { data: htmlData } = await supabase.from("settings").select("value").eq("key", "email_template_html").maybeSingle();
      if (htmlData?.value) setHtmlTemplate(htmlData.value as string);
      
      const { data: textData } = await supabase.from("settings").select("value").eq("key", "email_template_text").maybeSingle();
      if (textData?.value) setTextTemplate(textData.value as string);
      
      const { data: fromEmailData } = await supabase.from("settings").select("value").eq("key", "email_from_address").maybeSingle();
      if (fromEmailData?.value) setFromEmail(fromEmailData.value as string);
      
      const { data: fromNameData } = await supabase.from("settings").select("value").eq("key", "email_from_name").maybeSingle();
      if (fromNameData?.value) setFromName(fromNameData.value as string);
    } catch (e) { 
      console.error(e); 
      toast.error("Failed to load templates");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const replaceVariables = (template: string, data: PreviewData): string => {
    return template
      .replace(/\{\{business_name\}\}/g, data.business_name)
      .replace(/\{\{contact_name\}\}/g, data.contact_name)
      .replace(/\{\{contact_email\}\}/g, data.contact_email)
      .replace(/\{\{domain\}\}/g, data.domain)
      .replace(/\{\{plan_tier\}\}/g, data.plan_tier)
      .replace(/\{\{widget_id\}\}/g, data.widget_id)
      .replace(/\{\{agency_name\}\}/g, data.agency_name)
      .replace(/\{\{embed_code\}\}/g, data.embed_code)
      .replace(/\{\{\{embed_code\}\}\}/g, data.embed_code.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "email_subject", value: subject, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "email_template_html", value: htmlTemplate, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "email_template_text", value: textTemplate, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "email_from_address", value: fromEmail, updated_at: new Date().toISOString() });
      await supabase.from("settings").upsert({ key: "email_from_name", value: fromName, updated_at: new Date().toISOString() });
      toast.success("Email templates saved!");
    } catch (e) { 
      toast.error("Failed to save templates");
    }
    setSaving(false);
  };

  const handleReset = (): void => {
    if (!window.confirm("Reset to default templates? This will overwrite your current templates.")) return;
    setSubject(DEFAULT_SUBJECT);
    setHtmlTemplate(DEFAULT_HTML_TEMPLATE);
    setTextTemplate(DEFAULT_TEXT_TEMPLATE);
    toast.info("Templates reset to defaults. Click Save to apply.");
  };

  const insertVariable = (variable: string): void => {
    const activeElement = document.activeElement as HTMLTextAreaElement | null;
    if (activeElement && activeElement.tagName === "TEXTAREA") {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;
      const newValue = value.substring(0, start) + variable + value.substring(end);
      
      if (activeElement.id === "html-editor") {
        setHtmlTemplate(newValue);
      } else if (activeElement.id === "text-editor") {
        setTextTemplate(newValue);
      } else if (activeElement.id === "subject-editor") {
        setSubject(newValue);
      }
      
      setTimeout(() => {
        activeElement.focus();
        activeElement.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setHtmlTemplate(prev => prev + variable);
    }
  };

  const handlePreviewDataChange = (field: keyof PreviewData, value: string): void => {
    setPreviewData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-6 text-[#64748b]">Loading templates...</div>;

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader 
        title="Email Templates" 
        subtitle="Customize the emails sent when widgets are delivered" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* From Settings */}
          <Card className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-[#007bff]" />
                Sender Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#94a3b8]">From Name</Label>
                  <Input 
                    id="from-name"
                    value={fromName} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFromName(e.target.value)} 
                    className="bg-[#0f1117] border-[#2e3245] text-white" 
                  />
                </div>
                <div>
                  <Label className="text-[#94a3b8]">From Email</Label>
                  <Input 
                    id="from-email"
                    type="email"
                    value={fromEmail} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFromEmail(e.target.value)} 
                    className="bg-[#0f1117] border-[#2e3245] text-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Line */}
          <Card className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="text-white">Subject Line</CardTitle>
              <CardDescription className="text-[#94a3b8]">
                Use variables like {'{{business_name}}'} to personalize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                id="subject-editor"
                value={subject} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} 
                className="bg-[#0f1117] border-[#2e3245] text-white" 
              />
            </CardContent>
          </Card>

          {/* Template Editor with Tabs */}
          <Card className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Code className="h-5 w-5 text-[#007bff]" />
                Email Body
              </CardTitle>
              <CardDescription className="text-[#94a3b8]">
                Both HTML and Text versions are sent. Edit both for best compatibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="bg-[#0f1117] border border-[#2e3245] mb-4">
                  <TabsTrigger value="html" className="data-[state=active]:bg-[#007bff] data-[state=active]:text-white">
                    <Code className="h-4 w-4 mr-2" /> HTML
                  </TabsTrigger>
                  <TabsTrigger value="text" className="data-[state=active]:bg-[#007bff] data-[state=active]:text-white">
                    <Type className="h-4 w-4 mr-2" /> Text
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="mt-0">
                  <textarea
                    id="html-editor"
                    value={htmlTemplate}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHtmlTemplate(e.target.value)}
                    className="w-full h-96 bg-[#0f1117] border border-[#2e3245] rounded-lg p-4 text-white font-mono text-sm resize-y focus:outline-none focus:border-[#007bff]"
                    spellCheck={false}
                  />
                </TabsContent>
                
                <TabsContent value="text" className="mt-0">
                  <textarea
                    id="text-editor"
                    value={textTemplate}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTextTemplate(e.target.value)}
                    className="w-full h-96 bg-[#0f1117] border border-[#2e3245] rounded-lg p-4 text-white font-mono text-sm resize-y focus:outline-none focus:border-[#007bff]"
                    spellCheck={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#007bff] hover:bg-[#0066cc]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Templates'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="border-[#2e3245] text-[#94a3b8] hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Right Column - Variables & Preview */}
        <div className="space-y-6">
          {/* Variables */}
          <Card className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="text-white text-base">Variables</CardTitle>
              <CardDescription className="text-[#94a3b8] text-xs">
                Click to insert into active editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => insertVariable(variable.key)}
                    className="w-full text-left p-2 rounded bg-[#0f1117] border border-[#2e3245] hover:border-[#007bff] hover:bg-[#007bff]/10 transition-colors group"
                  >
                    <code className="text-[#007bff] text-xs font-mono">{variable.key}</code>
                    <p className="text-[#64748b] text-xs mt-1">{variable.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Eye className="h-4 w-4 text-[#007bff]" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-xs">Preview Data</Label>
                <Input 
                  value={previewData.contact_name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handlePreviewDataChange('contact_name', e.target.value)}
                  placeholder="Contact Name"
                  className="bg-[#0f1117] border-[#2e3245] text-white text-sm"
                />
                <Input 
                  value={previewData.business_name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handlePreviewDataChange('business_name', e.target.value)}
                  placeholder="Business Name"
                  className="bg-[#0f1117] border-[#2e3245] text-white text-sm"
                />
                <Input 
                  value={previewData.domain}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handlePreviewDataChange('domain', e.target.value)}
                  placeholder="Domain"
                  className="bg-[#0f1117] border-[#2e3245] text-white text-sm"
                />
              </div>
              
              <div className="border-t border-[#2e3245] pt-4">
                <p className="text-[#94a3b8] text-xs mb-2">Subject:</p>
                <p className="text-white text-sm font-medium">
                  {replaceVariables(subject, previewData)}
                </p>
              </div>
              
              <div>
                <p className="text-[#94a3b8] text-xs mb-2">HTML Preview:</p>
                <div 
                  className="bg-white rounded p-3 text-black text-xs overflow-auto max-h-48"
                  dangerouslySetInnerHTML={{ __html: replaceVariables(htmlTemplate, previewData) }}
                />
              </div>
              
              <div>
                <p className="text-[#94a3b8] text-xs mb-2">Text Preview:</p>
                <pre className="bg-[#0f1117] rounded p-3 text-[#94a3b8] text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                  {replaceVariables(textTemplate, previewData)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
