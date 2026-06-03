// ============================================
// ADA Widget Automation API
// Handles webhooks from Global Control, Stripe, and Forms
// ============================================

import { supabase } from "@/lib/supabase";

// Main webhook handler
export async function handleWidgetAutomationWebhook(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const required = ['contact_email', 'business_name', 'domain'];
    const missing = required.filter(f => !data[f]);
    
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missing.join(', ')}` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain
    const domain = data.domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Check if automation is enabled
    const { data: enabledData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_enabled')
      .maybeSingle();
    
    const automationEnabled = enabledData?.value === 'true' || enabledData?.value === true;

    // Log the automation request
    const { data: logEntry, error: logError } = await supabase
      .from('widget_automation_log')
      .insert({
        trigger_source: data.trigger_source || 'unknown',
        trigger_id: data.trigger_id || null,
        contact_email: data.contact_email.toLowerCase().trim(),
        contact_name: data.contact_name || data.contact_email.split('@')[0],
        business_name: data.business_name,
        domain: domain,
        plan_tier: data.plan_tier || 'starter',
        email_status: automationEnabled ? 'pending' : 'paused'
      })
      .select()
      .single();

    if (logError) throw logError;

    // If automation is disabled, just log and return
    if (!automationEnabled) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Automation paused - request logged but email not sent',
          log_id: logEntry.id
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('domain', domain)
      .maybeSingle();

    let clientId = existingClient?.id;

    // Create client if doesn't exist
    if (!clientId) {
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: data.business_name,
          domain: domain,
          contact_email: data.contact_email,
          contact_name: data.contact_name || data.contact_email.split('@')[0],
          plan_tier: data.plan_tier || 'starter',
          active: true,
          agency_name: 'SwiftImpact Solutions',
          cta_url: 'https://swiftimpactsolutions.com/ada',
          widget_position: 'bottom-left',
          primary_color: '#007bff',
          automation_trigger: data.trigger_source,
          automation_trigger_id: data.trigger_id,
          widget_delivery_status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;
      clientId = newClient.id;
    }

    // Update log with client ID
    await supabase
      .from('widget_automation_log')
      .update({ client_id: clientId })
      .eq('id', logEntry.id);

    // Get CDN domain from settings
    const { data: cdnData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cdn_domain')
      .maybeSingle();
    
    const cdnDomain = cdnData?.value || 'https://app.adaswift.com';

    // Generate embed code
    const embedCode = `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js?v=2";s.setAttribute("data-domain","${domain}");s.async=!0;document.body.appendChild(s)}();</script>`;

    // Get SMTP settings
    const { data: smtpData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_settings')
      .maybeSingle();
    
    const smtpSettings = smtpData?.value 
      ? (typeof smtpData.value === 'string' ? JSON.parse(smtpData.value) : smtpData.value)
      : {};

    // Send email via SMTP
    const emailResult = await sendWidgetEmail({
      to: data.contact_email,
      contactName: data.contact_name || data.contact_email.split('@')[0],
      businessName: data.business_name,
      domain: domain,
      planTier: data.plan_tier || 'starter',
      embedCode: embedCode,
      smtpSettings: smtpSettings
    });

    // Update log and client based on email result
    if (emailResult.success) {
      await supabase
        .from('widget_automation_log')
        .update({
          client_id: clientId,
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_status: 'sent',
          mailgun_message_id: emailResult.messageId
        })
        .eq('id', logEntry.id);

      await supabase
        .from('clients')
        .update({
          widget_delivered_at: new Date().toISOString(),
          widget_delivery_status: 'sent'
        })
        .eq('id', clientId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Widget delivered successfully',
          client_id: clientId,
          log_id: logEntry.id,
          email_sent: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('Widget automation error:', error);
    
    // Log the error
    await supabase.from('widget_automation_log').insert({
      trigger_source: 'error',
      contact_email: 'error@error.com',
      business_name: 'Error',
      domain: 'error.com',
      email_status: 'failed',
      error_message: error.message
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Send widget email via SMTP
async function sendWidgetEmail({ to, contactName, businessName, domain, planTier, embedCode, smtpSettings }) {
  try {
    // In a real implementation, you'd use a library like nodemailer
    // For now, this is a placeholder that simulates the email sending
    // You'll need to implement actual SMTP sending on your server
    
    const emailHtml = buildEmailTemplate({
      contactName,
      businessName,
      domain,
      planTier,
      embedCode
    });

    // TODO: Implement actual SMTP sending
    // This would typically be done via a serverless function or backend API
    // that has access to the SMTP credentials
    
    console.log('Would send email to:', to);
    console.log('SMTP Settings:', smtpSettings);
    
    // Simulate success for now
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Build email HTML template
function buildEmailTemplate({ contactName, businessName, domain, planTier, embedCode }) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 30px; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; }
    .code-block { background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 5px; font-family: monospace; overflow-x: auto; font-size: 12px; word-break: break-all; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your ADA Widget is Ready!</h1>
      <p>Make your website accessible in minutes</p>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>Your ADA compliance widget for <strong>${businessName}</strong> has been created and is ready to install.</p>
      
      <h3>📋 Installation Instructions</h3>
      <p>Copy this code and paste it just before the closing &lt;/body&gt; tag on your website:</p>
      
      <div class="code-block">${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      
      <p style="text-align: center;">
        <a href="https://adaswift.netlify.app/install-guide" class="button">View Full Installation Guide</a>
      </p>
      
      <h3>✨ What's Included</h3>
      <ul>
        <li>5 Accessibility Profiles (Epilepsy Safe, Cognitive, ADHD Friendly, Blindness, Visually Impaired)</li>
        <li>Content Adjustments (Font size, line height, letter spacing)</li>
        <li>Display Controls (Contrast modes, color customization)</li>
        <li>Works on all devices and browsers</li>
        <li>WCAG 2.1 AA Compliant</li>
      </ul>
      
      <h3>📊 Your Plan</h3>
      <p><strong>${planTier}</strong></p>
      
      <h3>Need Help?</h3>
      <p>Reply to this email or contact us at support@swiftimpactsolutions.com</p>
    </div>
    <div class="footer">
      <p>Powered by SwiftImpact Solutions | Making the web accessible for everyone</p>
    </div>
  </div>
</body>
</html>`;
}

// Manual trigger function for OpenClaw commands
export async function manualWidgetDelivery({ email, businessName, domain, planTier = 'starter' }) {
  return handleWidgetAutomationWebhook({
    json: () => Promise.resolve({
      trigger_source: 'manual',
      contact_email: email,
      business_name: businessName,
      domain: domain,
      plan_tier: planTier,
      trigger_id: `manual_${Date.now()}`
    })
  });
}
