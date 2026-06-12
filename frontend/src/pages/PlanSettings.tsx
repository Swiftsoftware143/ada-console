import { useState, useEffect } from "react";
import { Save, RefreshCw, DollarSign, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlanFeatures {
  profiles: boolean;
  content: boolean;
  display: boolean;
  keyboard: boolean;
}

interface Plan {
  id: string;
  name: string;
  max_pages: number;
  price: number;
  features: PlanFeatures;
}

const defaultPlans: Plan[] = [
  { id: 'basic', name: 'Basic', max_pages: 5, price: 0, features: { profiles: true, content: true, display: true, keyboard: false } },
  { id: 'starter', name: 'Starter', max_pages: 25, price: 47, features: { profiles: true, content: true, display: true, keyboard: false } },
  { id: 'pro', name: 'Pro', max_pages: 100, price: 97, features: { profiles: true, content: true, display: true, keyboard: true } },
  { id: 'growth', name: 'Growth', max_pages: 500, price: 297, features: { profiles: true, content: true, display: true, keyboard: true } },
  { id: 'enterprise', name: 'Enterprise', max_pages: 999999, price: 0, features: { profiles: true, content: true, display: true, keyboard: true } },
];

const featureLabels: Record<keyof PlanFeatures, string> = {
  profiles: 'Accessibility Profiles',
  content: 'Content Adjustments',
  display: 'Display & Colors',
  keyboard: 'Virtual Keyboard'
};

export default function PlanSettings(): JSX.Element {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "plan_config")
        .maybeSingle();

      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        setPlans(defaultPlans.map(defaultPlan => ({
          ...defaultPlan,
          ...parsed.find((p: Plan) => p.id === defaultPlan.id)
        })));
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({
        key: "plan_config",
        value: JSON.stringify(plans),
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

      toast.success("Plan settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const updatePlan = (planId: string, field: keyof Plan, value: number): void => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, [field]: value } : plan
    ));
  };

  const updateFeature = (planId: string, feature: keyof PlanFeatures, enabled: boolean): void => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { 
        ...plan, 
        features: { ...plan.features, [feature]: enabled }
      } : plan
    ));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[#007bff]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
            Plan Settings
          </h1>
          <p className="text-[#94a3b8]">Configure plan tiers and features</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#007bff] hover:bg-[#0056b3] text-white"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-[#1e2130] border-[#2e3245]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#007bff]" />
                {plan.name}
              </CardTitle>
              <CardDescription className="text-[#94a3b8]">
                Configure {plan.name.toLowerCase()} plan settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#94a3b8]">Max Pages</Label>
                <Input
                  type="number"
                  value={plan.max_pages}
                  onChange={(e) => updatePlan(plan.id, 'max_pages', parseInt(e.target.value) || 0)}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94a3b8] flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price (USD)
                </Label>
                <Input
                  type="number"
                  value={plan.price}
                  onChange={(e) => updatePlan(plan.id, 'price', parseInt(e.target.value) || 0)}
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94a3b8]">Features</Label>
                <div className="space-y-2">
                  {(Object.keys(featureLabels) as Array<keyof PlanFeatures>).map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${plan.id}-${feature}`}
                        checked={plan.features[feature]}
                        onCheckedChange={(checked) => updateFeature(plan.id, feature, checked as boolean)}
                      />
                      <Label
                        htmlFor={`${plan.id}-${feature}`}
                        className="text-sm text-[#94a3b8] cursor-pointer"
                      >
                        {featureLabels[feature]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
