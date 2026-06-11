// SEO Settings API
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import { SEOSettings } from '../../types/seo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin auth
  // const isAdmin = await checkAdminAuth(req);
  // if (!isAdmin) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('seo_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json(data || {});
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      return res.status(500).json({ message: 'Failed to fetch SEO settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const settings: Partial<SEOSettings> = req.body;
      
      // Upsert settings
      const { data, error } = await supabaseAdmin
        .from('seo_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      return res.status(500).json({ message: 'Failed to save SEO settings' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
