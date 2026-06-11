// SEO Settings Admin Page
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SEOSettings, DEFAULT_SEO } from '../../types/seo';

export default function SEOAdmin(): JSX.Element {
  const [settings, setSettings] = useState<SEOSettings>(DEFAULT_SEO as SEOSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/seo-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...DEFAULT_SEO, ...data } as SEOSettings);
      }
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/seo-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('✅ SEO settings saved successfully!');
      } else {
        setMessage('❌ Failed to save settings');
      }
    } catch (error) {
      setMessage('❌ Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SEOSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SEO Settings | Admin</title>
      </Head>

      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">SEO Settings</h1>
            <p className="text-white/70">Customize meta tags, schema markup, and social sharing</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic SEO */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic SEO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Site Name</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    className="form-input"
                    placeholder="FunnelSwift"
                  />
                </div>

                <div>
                  <label className="form-label">Site URL</label>
                  <input
                    type="url"
                    value={settings.site_url}
                    onChange={(e) => handleChange('site_url', e.target.value)}
                    className="form-input"
                    placeholder="https://funnelswift.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Site Description</label>
                  <textarea
                    value={settings.site_description}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Brief description of your site"
                  />
                  <p className="text-sm text-gray-500 mt-1">Recommended: 150-160 characters</p>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={settings.site_keywords}
                    onChange={(e) => handleChange('site_keywords', e.target.value)}
                    className="form-input"
                    placeholder="marketing, automation, SaaS"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Social Media</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Open Graph Image URL</label>
                  <input
                    type="url"
                    value={settings.og_image}
                    onChange={(e) => handleChange('og_image', e.target.value)}
                    className="form-input"
                    placeholder="/og-image.png"
                  />
                  <p className="text-sm text-gray-500 mt-1">Recommended: 1200x630px</p>
                </div>

                <div>
                  <label className="form-label">Twitter Handle</label>
                  <input
                    type="text"
                    value={settings.twitter_handle}
                    onChange={(e) => handleChange('twitter_handle', e.target.value)}
                    className="form-input"
                    placeholder="@funnelswift"
                  />
                </div>

                <div>
                  <label className="form-label">Facebook App ID</label>
                  <input
                    type="text"
                    value={settings.facebook_app_id}
                    onChange={(e) => handleChange('facebook_app_id', e.target.value)}
                    className="form-input"
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>

            {/* Schema Markup */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schema Markup</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Schema Type</label>
                  <select
                    value={settings.schema_type}
                    onChange={(e) => handleChange('schema_type', e.target.value)}
                    className="form-input"
                  >
                    <option value="Organization">Organization</option>
                    <option value="LocalBusiness">Local Business</option>
                    <option value="SoftwareApplication">Software Application</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="form-input"
                    placeholder="FunnelSwift Inc."
                  />
                </div>

                <div>
                  <label className="form-label">Company Logo URL</label>
                  <input
                    type="url"
                    value={settings.company_logo}
                    onChange={(e) => handleChange('company_logo', e.target.value)}
                    className="form-input"
                    placeholder="/logo.png"
                  />
                </div>

                <div>
                  <label className="form-label">Company Phone</label>
                  <input
                    type="tel"
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="form-label">Company Email</label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    className="form-input"
                    placeholder="hello@funnelswift.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Company Address</label>
                  <input
                    type="text"
                    value={settings.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    className="form-input"
                    placeholder="123 Main St, Orlando, FL 32801, USA"
                  />
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics & Tracking</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Google Analytics ID</label>
                  <input
                    type="text"
                    value={settings.google_analytics_id}
                    onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                    className="form-input"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="form-label">Google Site Verification</label>
                  <input
                    type="text"
                    value={settings.google_site_verification}
                    onChange={(e) => handleChange('google_site_verification', e.target.value)}
                    className="form-input"
                    placeholder="verification_code"
                  />
                </div>

                <div>
                  <label className="form-label">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={settings.facebook_pixel_id}
                    onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
                    className="form-input"
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-lg"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save SEO Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
