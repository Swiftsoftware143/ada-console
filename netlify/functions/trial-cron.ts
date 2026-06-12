// ADASwift Trial Expiration Cron Job
// Runs daily to check and deactivate expired trials

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface DemoAccount {
  id: string;
  email: string;
  first_name?: string;
  demo_code: string;
  funnelswift_tracking_id?: string;
  status: string;
  trial_ends_at: string;
}

interface Payment {
  id: string;
  demo_account_id: string;
  plan_tier: string;
  status: string;
}

interface ExpirationEmailData {
  to: string;
  firstName?: string;
  demoCode: string;
  upgradeUrl: string;
}

export const handler: Handler = async (event, context) => {
  try {
    const now = new Date().toISOString();
    
    // Find all active demos/trials that have expired
    const { data: expiredAccounts, error: fetchError } = await supabase
      .from('demo_accounts')
      .select('*')
      .eq('status', 'active')
      .lt('trial_ends_at', now);

    if (fetchError) throw fetchError;

    let deactivatedCount = 0;
    let upgradedCount = 0;

    for (const account of (expiredAccounts || []) as DemoAccount[]) {
      // Check if they upgraded
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('demo_account_id', account.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (payment) {
        // They paid - convert to paid account
        await supabase
          .from('demo_accounts')
          .update({
            status: 'converted',
            converted_at: now,
            plan: (payment as Payment).plan_tier,
          })
          .eq('id', account.id);

        upgradedCount++;
      } else {
        // No payment - deactivate widget
        await supabase
          .from('demo_accounts')
          .update({
            status: 'expired',
            widget_active: false,
            deactivated_at: now,
          })
          .eq('id', account.id);

        // Deactivate the widget
        await supabase
          .from('personal_websites')
          .update({
            widget_active: false,
            status: 'expired',
          })
          .eq('funnelswift_tracking_id', account.funnelswift_tracking_id);

        // Send expiration email with upgrade link
        await sendExpirationEmail({
          to: account.email,
          firstName: account.first_name,
          demoCode: account.demo_code,
          upgradeUrl: 'https://your-checkout.com/adaswift-upgrade',
        });

        deactivatedCount++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        checked: expiredAccounts?.length || 0,
        deactivated: deactivatedCount,
        upgraded: upgradedCount,
        message: 'Trial expiration check complete',
      }),
    };

  } catch (error) {
    console.error('Trial cron error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};

async function sendExpirationEmail({ to, firstName, demoCode, upgradeUrl }: ExpirationEmailData): Promise<{ success: boolean }> {
  const emailHtml = `
    <h1>Your ADASwift Demo Has Expired</h1>
    <p>Hi ${firstName || 'there'},</p>
    <p>Your 30-day demo (code: ${demoCode}) has ended.</p>
    
    <h2>Don't Lose Your Widget!</h2>
    <p>Upgrade now to keep your ADA compliance widget active:</p>
    
    <a href="${upgradeUrl}" style="padding: 12px 24px; background: #5B4FFF; color: white; text-decoration: none; border-radius: 5px;">Upgrade Now</a>
    
    <h2>Why Upgrade?</h2>
    <ul>
      <li>Stay ADA compliant</li>
      <li>Avoid lawsuits</li>
      <li>Help disabled visitors</li>
    </ul>
    
    <p>Questions? Reply to this email.</p>
  `;

  // TODO: Send via your email provider
  console.log('Expiration email would be sent to:', to);
  
  return { success: true };
}
