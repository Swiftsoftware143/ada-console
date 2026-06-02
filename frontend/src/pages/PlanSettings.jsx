import { useState, useEffect } from "react";
import { Save, RefreshCw, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const defaultThresholds = {
  basic_max: 5,
  starter_max: 25,
  pro_max: 100,
  growth_max: 500,
};

const defaultFeatures = {
  basic: { profiles: true, content: true, display: true, virtualKeyboard: false },
  starter: { profiles: true, content: true, display: true, virtualKeyboard: false },
  pro: { profiles: true, content: true, display: true, virtualKeyboard: true },
  growth: { profiles: true, content: true, display: true, virtualKeyboard: true },
  enterprise: { profiles: true, content: true, display: true, virtualKeyboard: true },
};

const planPricing = {
  basic: "$0",
  starter: "$47/mo",
  pro: "$97/mo",
  growth: "$297/mo",
  enterprise: "Custom",
};

export default function PlanSettings() {
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [features, setFeatures] = useState(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load thresholds
      const { data: thresholdsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "plan_thresholds")
        .maybeSingle();

      if (thresholdsData?.value) {
        const parsed = typeof thresholdsData.value === "string" ? JSON.parse(thresholdsData.value) : thresholdsData.value;
        setThresholds({ ...defaultThresholds, ...parsed });
      }

      // Load features
      const { data: featuresData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "plan_features")
        .maybeSingle();

      if (featuresData?.value) {
        const parsed = typeof featuresData.value === "string" ? JSON.parse(featuresData.value) : featuresData.value;
        setFeatures({ ...defaultFeatures, ...parsed });
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate thresholds
      const { basic_max, starter_max, pro_max, growth_max } = thresholds;
      
      if (basic_max >= starter_max || starter_max >= pro_max || pro_max >= growth_max) {
        toast.error("Each plan must have a higher page limit than the previous");
        return;
      }

      // Save thresholds
      const { error: thresholdsError } = await supabase
        .from("settings")
        .upsert(
          {
            key: "plan_thresholds",
            value: JSON.stringify(thresholds),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (thresholdsError) throw thresholdsError;

      // Save features
      const { error: featuresError } = await supabase
        .from("settings")
        .upsert(
          {
            key: "plan_features",
            value: JSON.stringify(features),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (featuresError) throw featuresError;

      toast.success("Plan settings saved successfully");
    } catch (e) {
      toast.error("Failed to save settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    setFeatures(defaultFeatures);
    toast.info("Reset to default values. Click Save to apply.");
  };

  const updateFeature = (plan, feature, enabled) => {
    setFeatures(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [feature]: enabled
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-[#0f1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Plan Settings</h1>
        <p className="text-[#94a3b8] mt-1">
          Configure automatic plan assignment and feature availability
        </p>
      </div>

      <Alert className="mb-6 bg-[#1e2130] border-[#2e3245] text-[#94a3b8]">
        <Info className="h-4 w-4 text-[#007bff]" />
        <AlertDescription className="text-[#94a3b8]">
          The widget detects page count and assigns plans automatically. Control which features 
          are available for each plan tier below.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Page Threshold Settings */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Page Count Thresholds</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Set the maximum page count for each plan tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { key: 'basic_max', label: 'Basic', pages: `1-${thresholds.basic_max}` },
                { key: 'starter_max', label: 'Starter', pages: `${thresholds.basic_max + 1}-${thresholds.starter_max}` },
                { key: 'pro_max', label: 'Pro', pages: `${thresholds.starter_max + 1}-${thresholds.pro_max}` },
                { key: 'growth_max', label: 'Growth', pages: `${thresholds.pro_max + 1}-${thresholds.growth_max}` },
                { key: 'enterprise', label: 'Enterprise', pages: `${thresholds.growth_max + 1}+` },
              ].map((plan) => (
                <div key={plan.key} className="space-y-2">
                  <Label className="text-[#94a3b8]">{plan.label}</Label>
                  {plan.key !== 'enterprise' ? (
                    <Input
                      type="number"
                      min="1"
                      value={thresholds[plan.key]}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, [plan.key]: parseInt(e.target.value) || 0 })
                      }
                      className="bg-[#0f1117] border-[#2e3245] text-white"
                    />
                  ) : (
                    <div className="h-10 flex items-center text-[#64748b]">Unlimited</div>
                  )}
                  <p className="text-sm text-[#64748b]">{plan.pages} pages</p>
                  <p className="text-sm text-[#007bff] font-medium">{planPricing[plan.key.replace('_max', '')]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Controls */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Feature Availability by Plan</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Control which widget features are available for each plan tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {Object.entries(features).map(([plan, planFeatures]) => (
                <div key={plan} className="space-y-4">
                  <h3 className="font-semibold text-white capitalize text-center pb-2 border-b border-[#2e3245]">
                    {plan}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${plan}-profiles`}
                        checked={planFeatures.profiles}
                        onCheckedChange={(checked) => updateFeature(plan, 'profiles', checked)}
                        className="border-[#2e3245]"
                      />
                      <Label htmlFor={`${plan}-profiles`} className="text-[#94a3b8] text-sm">
                        Accessibility Profiles
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${plan}-content`}
                        checked={planFeatures.content}
                        onCheckedChange={(checked) => updateFeature(plan, 'content', checked)}
                        className="border-[#2e3245]"
                      />
                      <Label htmlFor={`${plan}-content`} className="text-[#94a3b8] text-sm">
                        Content Adjustments
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${plan}-display`}
                        checked={planFeatures.display}
                        onCheckedChange={(checked) => updateFeature(plan, 'display', checked)}
                        className="border-[#2e3245]"
                      />
                      <Label htmlFor={`${plan}-display`} className="text-[#94a3b8] text-sm">
                        Display & Colors
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${plan}-virtualKeyboard`}
                        checked={planFeatures.virtualKeyboard}
                        onCheckedChange={(checked) => updateFeature(plan, 'virtualKeyboard', checked)}
                        className="border-[#2e3245]"
                      />
                      <Label htmlFor={`${plan}-virtualKeyboard`} className="text-[#94a3b8] text-sm">
                        Virtual Keyboard
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e3245]">
                    <th className="text-left py-2 text-[#94a3b8]">Plan</th>
                    <th className="text-left py-2 text-[#94a3b8]">Pages</th>
                    <th className="text-left py-2 text-[#94a3b8]">Price</th>
                    <th className="text-left py-2 text-[#94a3b8]">Features</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Basic', pages: `1-${thresholds.basic_max}`, price: planPricing.basic, features: features.basic },
                    { name: 'Starter', pages: `${thresholds.basic_max + 1}-${thresholds.starter_max}`, price: planPricing.starter, features: features.starter },
                    { name: 'Pro', pages: `${thresholds.starter_max + 1}-${thresholds.pro_max}`, price: planPricing.pro, features: features.pro },
                    { name: 'Growth', pages: `${thresholds.pro_max + 1}-${thresholds.growth_max}`, price: planPricing.growth, features: features.growth },
                    { name: 'Enterprise', pages: `${thresholds.growth_max + 1}+`, price: planPricing.enterprise, features: features.enterprise },
                  ].map((plan) => (
                    <tr key={plan.name} className="border-b border-[#2e3245]">
                      <td className="py-3 text-white font-medium">{plan.name}</td>
                      <td className="py-3 text-[#94a3b8]">{plan.pages}</td>
                      <td className="py-3 text-[#007bff]">{plan.price}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {plan.features.profiles && <span className="text-xs bg-[#007bff20] text-[#007bff] px-2 py-1 rounded">Profiles</span>}
                          {plan.features.content && <span className="text-xs bg-[#007bff20] text-[#007bff] px-2 py-1 rounded">Content</span>}
                          {plan.features.display && <span className="text-xs bg-[#007bff20] text-[#007bff] px-2 py-1 rounded">Display</span>}
                          {plan.features.virtualKeyboard && <span className="text-xs bg-[#007bff20] text-[#007bff] px-2 py-1 rounded">Keyboard</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27]"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-[#007bff] hover:bg-[#0056b3]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
