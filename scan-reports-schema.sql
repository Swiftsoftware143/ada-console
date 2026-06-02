-- ============================================
-- ADA Scan Reports - Database Schema
-- ============================================

-- 1. Create client scan settings table
CREATE TABLE IF NOT EXISTS client_scan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  monthly_scan_enabled boolean DEFAULT false,
  scan_frequency text DEFAULT 'monthly' CHECK (scan_frequency IN ('monthly', 'weekly', 'never')),
  last_scan_at timestamptz,
  last_scan_score integer CHECK (last_scan_score >= 0 AND last_scan_score <= 100),
  last_scan_report_url text,
  scan_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE client_scan_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read scan settings"
  ON client_scan_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert scan settings"
  ON client_scan_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update scan settings"
  ON client_scan_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. Create scan reports table
CREATE TABLE IF NOT EXISTS scan_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  scan_date timestamptz DEFAULT now(),
  domain text NOT NULL,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  wcag_aa_score integer CHECK (wcag_aa_score >= 0 AND wcag_aa_score <= 100),
  error_count integer DEFAULT 0,
  warning_count integer DEFAULT 0,
  notice_count integer DEFAULT 0,
  report_url text,
  report_pdf_path text,
  scan_results jsonb,
  previous_scan_id uuid REFERENCES scan_reports(id),
  improvement_score integer,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read scan reports"
  ON scan_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert scan reports"
  ON scan_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update scan reports"
  ON scan_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. Create function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(p_client_id uuid)
RETURNS integer AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT scan_count INTO current_count FROM client_scan_settings WHERE client_id = p_client_id;
  RETURN COALESCE(current_count, 0) + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to get scan statistics
CREATE OR REPLACE FUNCTION get_scan_statistics(p_days integer DEFAULT 30)
RETURNS TABLE(
  total_scans bigint,
  avg_score numeric,
  total_errors bigint,
  total_warnings bigint,
  clients_scanned bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_scans,
    ROUND(AVG(overall_score), 1) as avg_score,
    SUM(error_count)::bigint as total_errors,
    SUM(warning_count)::bigint as total_warnings,
    COUNT(DISTINCT client_id)::bigint as clients_scanned
  FROM scan_reports
  WHERE scan_date >= now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_reports_client_id ON scan_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_scan_date ON scan_reports(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_scan_reports_domain ON scan_reports(domain);
CREATE INDEX IF NOT EXISTS idx_client_scan_settings_client_id ON client_scan_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_scan_settings_enabled ON client_scan_settings(monthly_scan_enabled) WHERE monthly_scan_enabled = true;

-- 6. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_scan_settings_updated_at ON client_scan_settings;
CREATE TRIGGER update_client_scan_settings_updated_at
  BEFORE UPDATE ON client_scan_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant permissions
GRANT ALL ON client_scan_settings TO authenticated;
GRANT ALL ON client_scan_settings TO service_role;
GRANT ALL ON scan_reports TO authenticated;
GRANT ALL ON scan_reports TO service_role;

-- 8. Create storage bucket for reports (run in Supabase dashboard or use API)
-- Note: This needs to be done via Supabase dashboard or Storage API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scan-reports', 'scan-reports', false);

-- Verify
SELECT 'Scan reports schema created successfully' as status;
