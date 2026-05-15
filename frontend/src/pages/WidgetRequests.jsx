import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Puzzle, Send, Clock, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

// NoCodeBackend Config
const NOCODEBACKEND_API_KEY = '3a8c4c52bfafbe26fe25ca473f8a25bbea6c66448a6dfef2bab6fe8a67ef';
const NOCODEBACKEND_BASE = 'https://openapi.nocodebackend.com';
const INSTANCE = '54738_ada_swift';
const WEBHOOK_SERVER = 'http://localhost:3459';

export default function WidgetRequests() {
  // Widget Requests page - NoCodeBackend integration
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showEmbed, setShowEmbed] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    plan_tier: 'basic',
    auto_deliver: true
  });

  const loadWidgets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NOCODEBACKEND_BASE}/read/ada_widget_requests?Instance=${INSTANCE}&limit=1000&sort=created_at&order=desc`, {
        headers: {
          'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to load widgets');
      
      const data = await response.json();
      setWidgets(data.data || []);
    } catch (error) {
      console.error('Load error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const stats = useMemo(() => {
    const total = widgets.length;
    const pending = widgets.filter(w => w.status === 'pending' || w.status === 'pending_review').length;
    const delivered = widgets.filter(w => w.status === 'delivered').length;
    const autoDeliver = widgets.filter(w => w.auto_deliver).length;
    return { total, pending, delivered, autoDeliver };
  }, [widgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    // Check for duplicates
    const duplicate = widgets.find(w => 
      w.contact_email === formData.contact_email || 
      w.domain === formData.domain
    );

    if (duplicate) {
      setMessage({ type: 'error', text: 'A widget already exists for this email or domain' });
      setFormLoading(false);
      return;
    }

    try {
      // Create clean data object for JSON serialization
      const submitData = {
        business_name: String(formData.business_name || ''),
        contact_name: String(formData.contact_name || ''),
        contact_email: String(formData.contact_email || ''),
        domain: String(formData.domain || ''),
        plan_tier: String(formData.plan_tier || 'basic'),
        auto_deliver: Boolean(formData.auto_deliver)
      };
      
      const response = await fetch(`${WEBHOOK_SERVER}/webhook/ada-widget-crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Widget created! ID: ${result.widget_id}` 
        });
        setFormData({
          business_name: '',
          contact_name: '',
          contact_email: '',
          domain: '',
          plan_tier: 'basic',
          auto_deliver: true
        });
        loadWidgets();
      } else {
        setMessage({ type: 'error', text: result.message || result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const deliverWidget = async (widgetId) => {
    try {
      const response = await fetch(`${WEBHOOK_SERVER}/internal/process-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget_id: widgetId, auto_deliver: true })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Widget delivered!' });
        loadWidgets();
      } else {
        setMessage({ type: 'error', text: result.error || 'Delivery failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const toggleAutoDeliver = async (widget) => {
    try {
      const newValue = !widget.auto_deliver;
      
      const response = await fetch(`${NOCODEBACKEND_BASE}/update/ada_widget_requests/${widget.id}?Instance=${INSTANCE}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_deliver: newValue })
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Auto-delivery ${newValue ? 'enabled' : 'disabled'}` 
        });
        loadWidgets();
      } else {
        setMessage({ type: 'error', text: 'Failed to update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const toggleEmbed = (widgetId) => {
    setShowEmbed(prev => ({ ...prev, [widgetId]: !prev[widgetId] }));
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'pro': return 'bg-purple-100 text-purple-700';
      case 'enterprise': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Widget Requests" 
        subtitle="Manage ADA widget requests and deliveries"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Widgets" value={stats.total} icon={Puzzle} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} />
        <StatCard title="Auto-Delivery" value={stats.autoDeliver} icon={Send} />
      </div>

      {/* Add Widget Form */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">Add New Website</h3>
        
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/30 text-green-400 border border-green-700' 
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#e2e8f0]">Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                placeholder="Acme Corporation"
                required
                className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#e2e8f0]">Contact Name *</Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                placeholder="John Doe"
                required
                className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#e2e8f0]">Contact Email *</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                placeholder="john@acme.com"
                required
                className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#e2e8f0]">Domain *</Label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="acme.com"
                required
                className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#e2e8f0]">Plan Tier</Label>
              <Select 
                value={formData.plan_tier}
                onValueChange={(value) => setFormData({...formData, plan_tier: value})}
              >
                <SelectTrigger className="bg-[#0f172a] border-[#334155] text-[#e2e8f0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#334155]">
                  <SelectItem value="basic" className="text-[#e2e8f0]">Basic</SelectItem>
                  <SelectItem value="pro" className="text-[#e2e8f0]">Pro</SelectItem>
                  <SelectItem value="enterprise" className="text-[#e2e8f0]">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="auto_deliver"
                checked={formData.auto_deliver}
                onChange={(e) => setFormData({...formData, auto_deliver: e.target.checked})}
                className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#4ade80] focus:ring-[#4ade80]"
              />
              <Label htmlFor="auto_deliver" className="cursor-pointer text-[#e2e8f0]">Auto-deliver widget</Label>
            </div>
          </div>
          <Button type="submit" disabled={formLoading} className="w-full sm:w-auto">
            {formLoading ? 'Adding...' : 'Add Website & Trigger Delivery'}
          </Button>
        </form>
      </div>

      {/* Widget List */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">Widget Requests</h3>
        
        {loading ? (
          <div className="text-center py-10 text-[#64748b]">Loading widgets...</div>
        ) : widgets.length === 0 ? (
          <div className="text-center py-10 text-[#64748b]">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No widgets yet. Add your first website above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {widgets.map((widget) => (
              <div 
                key={widget.widget_id}
                className="border border-[#334155] rounded-lg p-4 hover:border-[#4ade80] transition-colors bg-[#0f172a]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-[#0f172a]">{widget.business_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(widget.plan_tier)}`}>
                        {widget.plan_tier}
                      </span>
                      <StatusBadge status={widget.status} />
                      {widget.auto_deliver && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748b]">
                      {widget.contact_name} • {widget.contact_email} • {widget.domain}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Widget ID: {widget.widget_id.substring(0, 16)}...
                    </p>
                    
                    {showEmbed[widget.widget_id] && (
                      <pre className="mt-3 p-3 bg-[#0f172a] text-[#4ade80] rounded-lg text-xs overflow-x-auto border border-[#334155]">
                        {widget.embed_code || 'No embed code generated yet'}
                      </pre>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {widget.status !== 'delivered' && (
                      <Button
                        size="sm"
                        onClick={() => deliverWidget(widget.widget_id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Deliver Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAutoDeliver(widget)}
                    >
                      {widget.auto_deliver ? (
                        <><ToggleRight className="h-4 w-4 mr-1" /> Disable Auto</>
                      ) : (
                        <><ToggleLeft className="h-4 w-4 mr-1" /> Enable Auto</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleEmbed(widget.widget_id)}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      {showEmbed[widget.widget_id] ? 'Hide Code' : 'View Code'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
