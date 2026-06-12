import { useState, useEffect, useCallback } from "react";
import { 
  Scan, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ToggleLeft,
  ToggleRight,
  Download,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

interface Client {
  id: string;
  name: string;
  domain: string;
  contact_email?: string;
  contact_name?: string;
}

interface ScanSettings {
  [clientId: string]: {
    id: string;
    client_id: string;
    monthly_scan_enabled: boolean;
    scan_count: number;
    last_scan_date?: string;
  };
}

interface ScanReport {
  id: string;
  client_id: string;
  scan_date: string;
  score: number;
  issues_count: number;
  report_url?: string;
  clients?: {
    name: string;
    domain: string;
  };
}

export default function ScanReports(): JSX.Element {
  const [clients, setClients] = useState<Client[]>([]);
  const [scanSettings, setScanSettings] = useState<ScanSettings>({});
  const [recentScans, setRecentScans] = useState<ScanReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanningClient, setScanningClient] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, domain, contact_email, contact_name')
        .order('name');

      const { data: settingsData } = await supabase
        .from('client_scan_settings')
        .select('*');

      const { data: scansData } = await supabase
        .from('scan_reports')
        .select('*, clients(name, domain)')
        .order('scan_date', { ascending: false })
        .limit(10);

      const settingsMap: ScanSettings = {};
      settingsData?.forEach((setting: { client_id: string; id: string; monthly_scan_enabled: boolean; scan_count: number; last_scan_date?: string }) => {
        settingsMap[setting.client_id] = setting;
      });

      setClients(clientsData || []);
      setScanSettings(settingsMap);
      setRecentScans(scansData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load scan data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleClientScan = async (clientId: string, enabled: boolean): Promise<void> => {
    try {
      const { data: existing } = await supabase
        .from('client_scan_settings')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabase
          .from('client_scan_settings')
          .update({
            monthly_scan_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);
      } else {
        result = await supabase
          .from('client_scan_settings')
          .insert({
            client_id: clientId,
            monthly_scan_enabled: enabled,
            scan_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      setScanSettings(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          monthly_scan_enabled: enabled
        }
      }));

      toast.success(`Monthly scans ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling scan:', err);
      toast.error('Failed to update scan settings');
    }
  };

  const triggerManualScan = async (clientId: string): Promise<void> => {
    setScanningClient(clientId);
    try {
      const { error } = await supabase.functions.invoke('trigger-scan', {
        body: { clientId }
      });

      if (error) throw error;

      toast.success('Scan triggered successfully');
      loadData();
    } catch (err) {
      console.error('Error triggering scan:', err);
      toast.error('Failed to trigger scan');
    } finally {
      setScanningClient(null);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 70) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Scan Reports" subtitle="Accessibility scan reports and settings" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-[#007bff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Scan Reports" 
        subtitle="Accessibility scan reports and settings"
        actions={
          <Button onClick={loadData} variant="outline" className="border-[#2e3245]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748b]">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#007bff]" />
              <span className="text-2xl font-bold text-white">{clients.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748b]">Scans Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-white">
                {Object.values(scanSettings).filter((s: { monthly_scan_enabled: boolean }) => s.monthly_scan_enabled).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748b]">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-[#007bff]" />
              <span className="text-2xl font-bold text-white">{recentScans.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748b]">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-white">
                {recentScans.length > 0 
                  ? Math.round(recentScans.reduce((acc: number, s: ScanReport) => acc + s.score, 0) / recentScans.length)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Scan Settings */}
      <Card className="bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="text-white">Client Scan Settings</CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Enable monthly accessibility scans for each client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div 
                key={client.id}
                className="flex items-center justify-between p-4 bg-[#0f1117] rounded-lg border border-[#2e3245]"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="text-white font-medium">{client.name}</h4>
                    <p className="text-sm text-[#64748b]">{client.domain}</p>
                  </div>
                  {scanSettings[client.id]?.last_scan_date && (
                    <Badge variant="outline" className="border-[#2e3245] text-[#94a3b8]">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last scan: {new Date(scanSettings[client.id].last_scan_date!).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerManualScan(client.id)}
                    disabled={scanningClient === client.id}
                    className="border-[#2e3245]"
                  >
                    {scanningClient === client.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Scan className="h-4 w-4 mr-2" />
                    )}
                    Scan Now
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scanSettings[client.id]?.monthly_scan_enabled || false}
                      onCheckedChange={(checked) => toggleClientScan(client.id, checked)}
                    />
                    <Label className="text-[#94a3b8]">Monthly</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="bg-[#1e2130] border-[#2e3245]">
        <CardHeader>
          <CardTitle className="text-white">Recent Scans</CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Latest accessibility scan results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div 
                key={scan.id}
                className="flex items-center justify-between p-4 bg-[#0f1117] rounded-lg border border-[#2e3245]"
              >
                <div className="flex items-center gap-4">
                  {getScoreIcon(scan.score)}
                  <div>
                    <h4 className="text-white font-medium">{scan.clients?.name}</h4>
                    <p className="text-sm text-[#64748b]">{scan.clients?.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(scan.score)}`}>
                      {scan.score}
                    </div>
                    <div className="text-xs text-[#64748b]">Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-white">
                      {scan.issues_count}
                    </div>
                    <div className="text-xs text-[#64748b]">Issues</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#94a3b8]">
                      {new Date(scan.scan_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-[#64748b]">Date</div>
                  </div>
                  {scan.report_url && (
                    <Button size="sm" variant="outline" className="border-[#2e3245]" asChild>
                      <a href={scan.report_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Report
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
