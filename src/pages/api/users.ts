// ADASwift API: List/Export Users
import { NextApiRequest, NextApiResponse } from 'next';
import { getUsersBySystemTag } from '../../lib/supabase';
import { SYSTEM_TAG, UserProfile } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { tag = SYSTEM_TAG, plan, status, format = 'json' } = req.query;

    const users = await getUsersBySystemTag(tag as string, {
      plan: plan as string | undefined,
      status: status as string | undefined,
    });

    if (format === 'csv') {
      const csv = generateCSV(users);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="adaswift-users-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      users,
      count: users.length,
      filters: { tag, plan: plan || null, status: status || null },
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

function generateCSV(users: UserProfile[]): string {
  const headers = ['Email', 'Plan', 'System Tag', 'Status', 'MintBird ID', 'Signup Date', 'Last Updated'];
  const rows = users.map(u => [
    u.email,
    u.plan_id,
    u.system_tag,
    u.subscription_status,
    u.mintbird_customer_id,
    u.created_at,
    u.updated_at,
  ]);
  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
}
