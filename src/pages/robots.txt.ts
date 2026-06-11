// Dynamic Robots.txt Generator
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

    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/api/sitemap.xml

# Disallow admin routes
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/

# Crawl-delay
Crawl-delay: 1

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /
`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
}
