import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Mail, 
  Tag, 
  CreditCard, 
  FormInput, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Play,
  Pause
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function AutomationDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    bySource: {}
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [settings, setSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    fromEmail: "widgets@swiftimpactsolutions.com",
    fromName: "SwiftImpact Solutions"
  });

  const loadStats = useCallback(async () => {
    try {
      // Get stats from RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_automation_stats', { p_days: 30 });
      
      if (statsError) throw statsError;
      
      if (statsData && statsData[0]) {
        setStats({
          total: statsData[0].total_requests || 0,
          sent: statsData[0].emails_sent || 0,
          delivered: statsData[0].emails_delivered || 0,
          failed: statsData[0].emails_failed || 0,
          bySource: statsData[0].by_trigger_source || {}
        });
      }

      // Get recent logs
      const { data: logs, error: logsError } = await supabase
        .from('widget_automation_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (logsError) throw logsError;
      setRecentLogs(logs || []);

      // Load automation settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'automation_settings')
        .maybeSingle();
      
      if (settingsData?.value) {
        const parsed = typeof settingsData.value === 'string' 
          ? JSON.parse(settingsData.value) 
          : settingsData.value;
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // Load automation enabled status
      const { data: enabledData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'automation_enabled')
        .maybeSingle();
      
      if (enabledData?.value !== undefined) {
        setAutomationEnabled(enabledData.value === 'true' || enabledData.value === true);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      toast.error("Failed to load automation stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const saveSettings = async () => {
    try {
      await supabase.from('settings').upsert({
        key: 'automation_settings',
        value: JSON.stringify(settings),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const toggleAutomation = async (enabled) => {
    try {
      await supabase.from('settings').upsert({
        key: 'automation_enabled',
        value: enabled.toString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      setAutomationEnabled(enabled);
      toast.success(enabled ? "Automation enabled" : "Automation paused");
    } catch (err) {
      toast.error("Failed to toggle automation");
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'global_control': return <Tag className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      case 'paypal': return <CreditCard className="h-4 w-4" />;
      case 'form': return <FormInput className="h-4 w-4" />;
      case 'manual': return <Zap className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'global_control': return 'Global Control Tag';
      case 'stripe': return 'Stripe Payment';
      case 'paypal': return 'PayPal Payment';
      case 'form': return 'Form Submission';
      case 'manual': return 'Manual';
      default: return source;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-[#007bff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#0f1117] min-h-screen">
      <PageHeader
        title="Widget Automation"
        subtitle="Automated widget delivery system - track triggers, emails, and analytics"
      />

      {/* Master Toggle */}
      <Card className="mb-6 bg-[#1e2130] border-[#2e3245]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${automationEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {automationEnabled ? (
                  <Play className="h-6 w-6 text-green-500" />
                ) : (
                  <Pause className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Automation {automationEnabled ? 'Active' : 'Paused'}
                </h3>
                <p className="text-[#94a3b8]">
                  {automationEnabled 
                    ? 'New triggers will automatically send widget emails' 
                    : 'New triggers will be logged but emails won\'t be sent'}
                </p>
              </div>
            </div>
            <Switch
              checked={automationEnabled}
              onCheckedChange={toggleAutomation}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Total Requests</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-[#007bff]/20 rounded-lg">
                <Zap className="h-6 w-6 text-[#007bff]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Emails Sent</p>
                <p className="text-3xl font-bold text-blue-400">{stats.sent}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Delivered</p>
                <p className="text-3xl font-bold text-green-400">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Failed</p>
                <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trigger Sources */}
      <Card className="mb-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#007bff]" />
            Requests by Source (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.bySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between p-4 bg-[#0f1117] rounded-lg border border-[#2e3245]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#007bff]/20 rounded-lg">
                    {getSourceIcon(source)}
                  </div>
                  <span className="text-[#94a3b8]">{getSourceLabel(source)}</span>
                </div>
                <span className="text-xl font-bold text-white">{count}</span>
              </div>
            ))}
            {Object.keys(stats.bySource).length === 0 && (
              <div className="col-span-3 text-center py-8 text-[#64748b]">
                No automation requests yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Last 10 automation events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-[#0f1117] rounded-lg border border-[#2e3245]">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.email_status)}
                    <div>
                      <p className="text-white font-medium">{log.business_name}</p>
                      <p className="text-sm text-[#64748b]">{log.contact_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-[#2e3245] text-[#94a3b8]">
                      {getSourceLabel(log.trigger_source)}
                    </Badge>
                    <p className="text-xs text-[#64748b] mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="text-center py-8 text-[#64748b]">
                  No activity yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMTP Settings */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#007bff]" />
              Email Settings
            </CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Configure SMTP for automated widget delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#94a3b8]">SMTP Host</Label>
                <Input
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.mailgun.org"
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94a3b8]">SMTP Port</Label>
                <Input
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                  placeholder="587"
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">SMTP Username</Label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="postmaster@yourdomain.com"
                className="bg-[#0f1117] border-[#2e3245] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">SMTP Password</Label>
              <Input
                type="password"
                value={settings.smtpPass}
                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                placeholder="Your SMTP password"
                className="bg-[#0f1117] border-[#2e3245] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">From Email</Label>
              <Input
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="widgets@swiftimpactsolutions.com"
                className="bg-[#0f1117] border-[#2e3245] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">From Name</Label>
              <Input
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                placeholder="SwiftImpact Solutions"
                className="bg-[#0f1117] border-[#2e3245] text-white"
              />
            </div>
            <Button onClick={saveSettings} className="w-full bg-[#007bff]">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Webhook URLs */}
      <Card className="mt-6 bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="text-white">Webhook URLs</CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Use these URLs to connect your triggers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[#0f1117] rounded-lg border border-[#2e3245]">
            <Label className="text-[#94a3b8] mb-2 block">Global Control / Stripe / Form Webhook</Label>
            <code className="block p-3 bg-[#1e2130] rounded text-[#007bff] text-sm break-all">
              https://app.adaswift.com/api/webhook/widget-automation
            </code>
          </div>
          <div className="flex gap-4 text-sm text-[#64748b]">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Tag: <code className="text-[#007bff]">ada-widget-request</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Stripe: Payment webhook</span>
            </div>
            <div className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              <span>Form: POST to webhook URL</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
