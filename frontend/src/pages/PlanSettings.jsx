import { useState, useEffect } from "react";
import { Save, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const defaultThresholds = {
  basic_max: 5,
  starter_max: 25,
  pro_max: 100,
  growth_max: 500,
};

const planFeatures = {
  basic: { profiles: 3, features: "Basic accessibility features", price: "$0" },
  starter: { profiles: 5, features: "Standard features", price: "$47/mo" },
  pro: { profiles: 8, features: "Advanced features", price: "$97/mo" },
  growth: { profiles: 10, features: "Full features", price: "$297/mo" },
  enterprise: { profiles: 999, features: "Unlimited everything", price: "Custom" },
};

export default function PlanSettings() {
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "plan_thresholds")
        .maybeSingle();

      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        setThresholds({ ...defaultThresholds, ...parsed });
      }
    } catch (e) {
      console.error("Error loading thresholds:", e);
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

      const { error } = await supabase
        .from("settings")
        .upsert(
          {
            key: "plan_thresholds",
            value: JSON.stringify(thresholds),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast.success("Plan thresholds saved successfully");
    } catch (e) {
      toast.error("Failed to save thresholds: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    toast.info("Reset to default values. Click Save to apply.");
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
    <div className="p-6 max-w-4xl mx-auto bg-[#0f1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Plan Settings</h1>
        <p className="text-[#94a3b8] mt-1">
          Configure automatic plan assignment based on website page count
        </p>
      </div>

      <Alert className="mb-6 bg-[#1e2130] border-[#2e3245] text-[#94a3b8]">
        <Info className="h-4 w-4 text-[#007bff]" />
        <AlertDescription className="text-[#94a3b8]">
          The widget automatically detects the number of pages on a website and assigns 
          the appropriate plan tier. Adjust the thresholds below to control plan assignment.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="basic_max" className="text-[#94a3b8]">Basic Plan - Max Pages</Label>
                <Input
                  id="basic_max"
                  type="number"
                  min="1"
                  value={thresholds.basic_max}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, basic_max: parseInt(e.target.value) || 0 })
                  }
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
                <p className="text-sm text-[#64748b]">
                  1-{thresholds.basic_max} pages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="starter_max" className="text-[#94a3b8]">Starter Plan - Max Pages</Label>
                <Input
                  id="starter_max"
                  type="number"
                  min={thresholds.basic_max + 1}
                  value={thresholds.starter_max}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, starter_max: parseInt(e.target.value) || 0 })
                  }
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
                <p className="text-sm text-[#64748b]">
                  {thresholds.basic_max + 1}-{thresholds.starter_max} pages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pro_max" className="text-[#94a3b8]">Pro Plan - Max Pages</Label>
                <Input
                  id="pro_max"
                  type="number"
                  min={thresholds.starter_max + 1}
                  value={thresholds.pro_max}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, pro_max: parseInt(e.target.value) || 0 })
                  }
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
                <p className="text-sm text-[#64748b]">
                  {thresholds.starter_max + 1}-{thresholds.pro_max} pages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="growth_max" className="text-[#94a3b8]">Growth Plan - Max Pages</Label>
                <Input
                  id="growth_max"
                  type="number"
                  min={thresholds.pro_max + 1}
                  value={thresholds.growth_max}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, growth_max: parseInt(e.target.value) || 0 })
                  }
                  className="bg-[#0f1117] border-[#2e3245] text-white"
                />
                <p className="text-sm text-[#64748b]">
                  {thresholds.pro_max + 1}-{thresholds.growth_max} pages
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2e3245]">
              <p className="text-sm text-[#94a3b8]">
                <strong className="text-white">Enterprise:</strong> {thresholds.growth_max + 1}+ pages
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features Overview */}
        <Card className="bg-[#1e2130] border-[#2e3245]">
          <CardHeader>
            <CardTitle className="text-white">Plan Features</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Overview of features available in each plan tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(planFeatures).map(([plan, details]) => (
                <div
                  key={plan}
                  className="p-4 rounded-lg border border-[#2e3245] bg-[#0f1117]"
                >
                  <h3 className="font-semibold text-white capitalize mb-2">
                    {plan}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-[#94a3b8]">{details.price}</p>
                    <p className="text-[#94a3b8]">{details.profiles} profiles</p>
                    <p className="text-[#64748b]">{details.features}</p>
                  </div>
                </div>
              ))}
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
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
