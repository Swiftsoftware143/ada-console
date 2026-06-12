// Track when ADASwift client upgrades and notify FunnelSwift
// This credits the referring affiliate

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface UpgradePayload {
  client_id: string;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  mintbird_transaction_id?: string;
  mintbird_checkout_url?: string;
}

interface Client {
  id: string;
  email: string;
  funnelswift_tracking_id?: string;
  referred_by_user_id?: string;
  funnelswift_contact_id?: string;
}

interface FunnelSwiftNotification {
  tracking_id?: string;
  referred_by_user_id?: string;
  client_id: string;
  email: string;
  plan_name: string;
  plan_price: number;
  mintbird_transaction_id?: string;
  mintbird_checkout_url?: string;
  status: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload: UpgradePayload = JSON.parse(event.body || '{}');
    const {
      client_id,
      plan_name,
      plan_price,
      billing_cycle,
      mintbird_transaction_id,
      mintbird_checkout_url
    } = payload;

    // Get client info with tracking
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Client not found' })
      };
    }

    const typedClient = client as Client;

    // Only process if this client came from FunnelSwift
    if (!typedClient.funnelswift_tracking_id && !typedClient.referred_by_user_id) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Client not from FunnelSwift, no tracking needed',
          action: 'skipped'
        })
      };
    }

    // Log the upgrade event
    await supabase
      .from('integration_events')
      .insert({
        source: 'adaswift',
        event_type: 'demo.upgraded',
        client_id: client_id,
        tracking_id: typedClient.funnelswift_tracking_id,
        referred_by_user_id: typedClient.referred_by_user_id,
        funnelswift_contact_id: typedClient.funnelswift_contact_id,
        payload: {
          plan_name: plan_name,
          plan_price: plan_price,
          billing_cycle: billing_cycle,
          mintbird_transaction_id: mintbird_transaction_id,
          mintbird_checkout_url: mintbird_checkout_url
        },
        status: 'processed'
      });

    // Notify FunnelSwift about the upgrade
    await notifyFunnelSwift('demo.upgraded', {
      tracking_id: typedClient.funnelswift_tracking_id,
      referred_by_user_id: typedClient.referred_by_user_id,
      client_id: client_id,
      email: typedClient.email,
      plan_name: plan_name,
      plan_price: plan_price,
      mintbird_transaction_id: mintbird_transaction_id,
      mintbird_checkout_url: mintbird_checkout_url,
      status: 'upgraded'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Upgrade tracked successfully',
        tracking_id: typedClient.funnelswift_tracking_id,
        referred_by: typedClient.referred_by_user_id,
        action: 'tracked'
      })
    };

  } catch (error) {
    console.error('Track upgrade error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function notifyFunnelSwift(event_type: string, data: FunnelSwiftNotification): Promise<void> {
  try {
    const response = await fetch(process.env.FUNNELSWIFT_WEBHOOK_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FUNNELSWIFT_WEBHOOK_SECRET || ''}`
      },
      body: JSON.stringify({
        source: 'adaswift',
        event_type: event_type,
        payload: data
      })
    });

    if (!response.ok) {
      console.error('Failed to notify FunnelSwift:', await response.text());
    }
  } catch (error) {
    console.error('Failed to notify FunnelSwift:', error);
  }
}
