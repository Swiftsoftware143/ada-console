-- SEO Settings Table
CREATE TABLE IF NOT EXISTS seo_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    site_name TEXT DEFAULT 'FunnelSwift',
    site_description TEXT DEFAULT 'Automate your marketing workflows with FunnelSwift',
    site_keywords TEXT DEFAULT 'marketing automation, workflows, SaaS',
    site_url TEXT DEFAULT 'https://funnelswift.com',
    og_image TEXT DEFAULT '/og-image.png',
    twitter_handle TEXT DEFAULT '@funnelswift',
    facebook_app_id TEXT,
    google_analytics_id TEXT,
    google_site_verification TEXT,
    facebook_pixel_id TEXT,
    schema_type TEXT DEFAULT 'SoftwareApplication' CHECK (schema_type IN ('Organization', 'LocalBusiness', 'SoftwareApplication')),
    company_name TEXT,
    company_logo TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO seo_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SEO settings
CREATE POLICY "Admin can manage SEO settings" ON seo_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public can read SEO settings
CREATE POLICY "Public can read SEO settings" ON seo_settings
    FOR SELECT USING (true);
