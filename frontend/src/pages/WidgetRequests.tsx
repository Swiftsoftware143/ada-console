import { useCallback, useEffect, useMemo, useState, ChangeEvent } from "react";
import { Puzzle, Send, Clock, CheckCircle, AlertCircle, Code, Trash2, Edit2, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

interface Widget {
  id: string;
  contact_email: string;
  contact_name: string;
  business_name: string;
  domain: string;
  plan_tier: string;
  status: 'pending' | 'delivered' | 'failed';
  created_at: string;
  delivered_at?: string;
  widget_id: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
}

export default function WidgetRequests(): JSX.Element {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Widget>>({});
  
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: false,
    fromEmail: 'hello@swiftimpactsolutions.com',
    fromName: 'SwiftImpact Solutions',
  });

  const loadWidgets = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('widget_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWidgets(data || []);
    } catch (err) {
      console.error('Error loading widgets:', err);
      toast.error('Failed to load widget requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmailSettings = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'email_settings')
        .maybeSingle();
      
      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setEmailSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Error loading email settings:', err);
    }
  }, []);

  useEffect(() => {
    loadWidgets();
    loadEmailSettings();
  }, [loadWidgets, loadEmailSettings]);

  const handleDeliver = async (widget: Widget): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: widget.contact_email,
          from: emailSettings.fromEmail,
          fromName: emailSettings.fromName,
          subject: `Your ADA Widget is Ready - ${widget.business_name}`,
          html: generateEmailHtml(widget),
          text: generateEmailText(widget),
          smtpConfig: {
            host: emailSettings.smtpHost,
            port: parseInt(emailSettings.smtpPort),
            secure: emailSettings.smtpSecure,
            username: emailSettings.smtpUsername,
            password: emailSettings.smtpPassword,
          }
        }
      });

      if (error) throw error;

      await supabase
        .from('widget_requests')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', widget.id);

      toast.success('Widget delivered successfully');
      loadWidgets();
    } catch (err) {
      console.error('Error delivering widget:', err);
      toast.error('Failed to deliver widget');
    }
  };

  const handleDelete = async (widget: Widget): Promise<void> => {
    if (!confirm(`Delete widget request for ${widget.business_name}?`)) return;
    
    try {
      const { error } = await supabase
        .from('widget_requests')
        .delete()
        .eq('id', widget.id);
      
      if (error) throw error;
      toast.success('Widget request deleted');
      loadWidgets();
    } catch (err) {
      console.error('Error deleting widget:', err);
      toast.error('Failed to delete widget request');
    }
  };

  const handleEdit = (widget: Widget): void => {
    setEditingWidget(widget);
    setEditFormData({ ...widget });
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingWidget) return;
    
    try {
      const { error } = await supabase
        .from('widget_requests')
        .update(editFormData)
        .eq('id', editingWidget.id);
      
      if (error) throw error;
      toast.success('Widget request updated');
      setEditingWidget(null);
      loadWidgets();
    } catch (err) {
      console.error('Error updating widget:', err);
      toast.error('Failed to update widget request');
    }
  };

  const generateEmailHtml = (widget: Widget): string => {
    const embedCode = `<script src="https://adaswift.netlify.app/loader.js" data-domain="${widget.domain}"></script>`;
    
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#4ade80;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
    <h1>ADA Swift</h1><p>Your Widget is Ready!</p>
  </div>
  <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
    <p>Hi ${widget.contact_name},</p>
    <p>Your ADA compliance widget for <strong>${widget.domain}</strong> is ready!</p>
    <p><strong>Plan:</strong> ${widget.plan_tier}<br>
    <strong>Widget ID:</strong> ${widget.widget_id}</p>
    <h3>Your Embed Code:</h3>
    <div style="background:#1e293b;color:#4ade80;padding:15px;border-radius:4px;font-family:monospace;font-size:13px;overflow-x:auto;">${embedCode}</div>
    <p><strong>Installation:</strong></p>
    <ol><li>Copy the code above</li><li>Paste before the &lt;/body&gt; tag on your website</li><li>Save and publish</li></ol>
    <p>Need help? Reply to this email.</p>
    <p>Best,<br>SwiftImpact Solutions Team</p>
  </div>
</body>
</html>`;
  };

  const generateEmailText = (widget: Widget): string => {
    const embedCode = `<script src="https://adaswift.netlify.app/loader.js" data-domain="${widget.domain}"></script>`;
    
    return `Hi ${widget.contact_name},

Your ADA compliance widget for ${widget.domain} is ready!

Plan: ${widget.plan_tier}
Widget ID: ${widget.widget_id}

EMBED CODE:
${embedCode}

Installation:
1. Copy the code above
2. Paste before </body> tag on your website
3. Save and publish

Need help? Reply to this email.

Best,
SwiftImpact Solutions Team`;
  };

  const stats = useMemo(() => {
    const total = widgets.length;
    const pending = widgets.filter(w => w.status === 'pending').length;
    const delivered = widgets.filter(w => w.status === 'delivered').length;
    const failed = widgets.filter(w => w.status === 'failed').length;
    return { total, pending, delivered, failed };
  }, [widgets]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007bff]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Widget Requests"
        subtitle="Manage and deliver ADA widget requests"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.total.toString()}
          icon={Puzzle}
        />
        <StatCard
          title="Pending"
          value={stats.pending.toString()}
          icon={Clock}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Delivered"
          value={stats.delivered.toString()}
          icon={CheckCircle}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Failed"
          value={stats.failed.toString()}
          icon={AlertCircle}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2e3245]">
          <h2 className="text-lg font-semibold text-white">Widget Requests</h2>
        </div>
        
        <div className="divide-y divide-[#2e3245]">
          {widgets.map((widget) => (
            <div key={widget.id} className="p-4 hover:bg-[#1a1d27] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-medium">{widget.business_name}</h3>
                    <StatusBadge active={widget.status === 'delivered'} />
                  </div>
                  <p className="text-sm text-[#94a3b8] mt-1">
                    {widget.domain} • {widget.contact_email}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    Plan: {widget.plan_tier} • Created: {new Date(widget.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {widget.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleDeliver(widget)}
                      className="bg-[#007bff] hover:bg-[#0056b3]"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Deliver
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(widget)}
                    className="border-[#2e3245]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(widget)}
                    className="border-[#2e3245] text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Widget Request</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-[#94a3b8]">Business Name</Label>
                <Input
                  value={editFormData.business_name || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
              <div>
                <Label className="text-[#94a3b8]">Contact Name</Label>
                <Input
                  value={editFormData.contact_name || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
              <div>
                <Label className="text-[#94a3b8]">Contact Email</Label>
                <Input
                  value={editFormData.contact_email || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
              <div>
                <Label className="text-[#94a3b8]">Domain</Label>
                <Input
                  value={editFormData.domain || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, domain: e.target.value })}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
              <div>
                <Label className="text-[#94a3b8]">Plan Tier</Label>
                <Select
                  value={editFormData.plan_tier}
                  onValueChange={(value: string) => setEditFormData({ ...editFormData, plan_tier: value })}
                >
                  <SelectTrigger className="bg-[#0f1117] border-[#2e3245] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2130] border-[#2e3245]">
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingWidget(null)}
                className="border-[#2e3245]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-[#007bff] hover:bg-[#0056b3]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
