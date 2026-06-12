// Netlify Function: Global Control Webhook
// Triggered when tag is applied to contact in Global Control
// Endpoint: POST /.netlify/functions/globalcontrol-webhook

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

interface WebhookData {
  email?: string;
  contact_email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  company?: string;
  business_name?: string;
  website?: string;
  domain?: string;
  custom_website?: string;
  tag?: string;
  tagName?: string;
  contactId?: string;
  id?: string;
}

interface SMTPSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  fromName?: string;
  fromEmail?: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}') as WebhookData;
    
    // Global Control webhook format
    const contactEmail = data.email || data.contact_email;
    const contactName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name;
    const companyName = data.company || data.business_name || contactName;
    const domain = data.website || data.domain || data.custom_website;
    const tagName = data.tag || data.tagName;
    
    // Only process if tag is 'ada-widget-request'
    if (tagName !== 'ada-widget-request') {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Tag ignored - not ada-widget-request',
          tag: tagName
        })
      };
    }

    if (!contactEmail || !domain) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email and domain required'
        })
      };
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Check for duplicates (24 hour rule)
    const { data: recentEmail } = await supabase
      .from('widget_automation_log')
      .select('id')
      .eq('domain', cleanDomain)
      .eq('email_sent', true)
      .gte('email_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recentEmail) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Duplicate prevented - email already sent within 24 hours',
          duplicate: true
        })
      };
    }

    // Log the request
    const { data: logEntry } = await supabase
      .from('widget_automation_log')
      .insert({
        trigger_source: 'global_control',
        trigger_id: data.contactId || data.id,
        contact_email: contactEmail.toLowerCase().trim(),
        contact_name: contactName || contactEmail.split('@')[0],
        business_name: companyName || contactName,
        domain: cleanDomain,
        plan_tier: 'starter',
        email_status: 'pending'
      })
      .select()
      .single();

    // Get CDN domain
    const { data: cdnData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cdn_domain')
      .maybeSingle();
    
    const cdnDomain = cdnData?.value || 'https://app.adaswift.com';
    const embedCode = `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js?v=2";s.setAttribute("data-domain","${cleanDomain}");s.async=!0;document.body.appendChild(s)}();</script>`;

    // Get email template
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template')
      .maybeSingle();
    
    interface EmailTemplate {
      subject: string;
      htmlBody: string;
    }
    
    let emailTemplate: EmailTemplate = {
      subject: "🎉 Your ADA Widget is Ready - Installation Instructions Inside",
      htmlBody: defaultEmailTemplate
    };
    
    if (templateData?.value) {
      const parsed = typeof templateData.value === 'string' 
        ? JSON.parse(templateData.value) 
        : templateData.value;
      emailTemplate = { ...emailTemplate, ...parsed };
    }

    // Replace placeholders
    const emailHtml = emailTemplate.htmlBody
      .replace(/\{\{contact_name\}\}/g, contactName || contactEmail.split('@')[0])
      .replace(/\{\{business_name\}\}/g, companyName || contactName || 'Your Business')
      .replace(/\{\{domain\}\}/g, cleanDomain)
      .replace(/\{\{plan_tier\}\}/g, 'starter')
      .replace(/\{\{embed_code\}\}/g, embedCode);

    // Send email
    const { data: smtpData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_settings')
      .maybeSingle();
    
    const smtpSettings: SMTPSettings = smtpData?.value 
      ? (typeof smtpData.value === 'string' ? JSON.parse(smtpData.value) : smtpData.value)
      : {} as SMTPSettings;

    if (smtpSettings.smtpHost && smtpSettings.smtpUser && smtpSettings.smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpSettings.smtpHost,
        port: parseInt(smtpSettings.smtpPort) || 587,
        secure: (parseInt(smtpSettings.smtpPort) || 587) === 465,
        auth: {
          user: smtpSettings.smtpUser,
          pass: smtpSettings.smtpPass
        }
      });

      await transporter.sendMail({
        from: `"${smtpSettings.fromName || 'SwiftImpact Solutions'}" <${smtpSettings.fromEmail || smtpSettings.smtpUser}>`,
        to: contactEmail,
        subject: emailTemplate.subject,
        html: emailHtml
      });

      // Mark as sent
      await supabase
        .from('widget_automation_log')
        .update({ email_sent: true, email_sent_at: new Date().toISOString(), email_status: 'sent' })
        .eq('id', logEntry.id);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Widget delivered',
        log_id: logEntry.id
      })
    };

  } catch (error: unknown) {
    console.error('Global Control webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};

const defaultEmailTemplate = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 30px; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; }
    .code-block { background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your ADA Widget is Ready!</h1>
    </div>
    <div class="content">
      <h2>Hi {{contact_name}},</h2>
      <p>Your widget for <strong>{{business_name}}</strong> is ready!</p>
      <div class="code-block">{{embed_code}}</div>
      <p style="text-align: center;"><a href="https://adaswift.netlify.app/install-guide" class="button">View Installation Guide</a></p>
    </div>
    <div class="footer">
      <p>Powered by SwiftImpact Solutions</p>
    </div>
  </div>
</body>
</html>`;

export { handler };
