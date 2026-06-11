// Dynamic Sitemap Generator
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch SEO settings for base URL
    const { data: seoSettings } = await supabaseAdmin
      .from('seo_settings')
      .select('site_url')
      .single();

    const baseUrl = seoSettings?.site_url || 'https://funnelswift.com';

    // Static pages
    const pages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/signup', priority: 0.9, changefreq: 'weekly' },
      { url: '/login', priority: 0.8, changefreq: 'monthly' },
      { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
      { url: '/about', priority: 0.7, changefreq: 'monthly' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
      { url: '/privacy', priority: 0.5, changefreq: 'yearly' },
      { url: '/terms', priority: 0.5, changefreq: 'yearly' },
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
