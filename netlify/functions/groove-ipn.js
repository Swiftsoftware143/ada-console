// Netlify Serverless Function for GrooveSell IPN Webhook
// Endpoint: /.netlify/functions/groove-ipn
// GrooveSell IPN URL: https://app.adaswift.com/.netlify/functions/groove-ipn

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // GrooveSell sends POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // GrooveSell sends data as form-urlencoded or JSON
    let data;
    const contentType = event.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      data = JSON.parse(event.body);
    } else {
      // Parse form data
      const params = new URLSearchParams(event.body);
      data = Object.fromEntries(params);
    }

    console.log('Groove IPN received:', data);

    // Extract data from GrooveSell IPN
    // Your exact form field names: first_name, last_name, email, phone_number, Company, website URL
    const contactEmail = data.email || data.customer_email || data.buyer_email;
    const firstName = data.first_name || '';
    const lastName = data.last_name || '';
    const contactName = `${firstName} ${lastName}`.trim() || data.customer_name || data.buyer_name || data.name || '';
    const phoneNumber = data.phone_number || data.phone || '';
    const companyName = data.Company || data.company || data.business_name || contactName;
    const domain = data['website URL'] || data.website || data.domain || data.website_url || data.custom_website;
    const productName = data.product_name || data.plan_tier || 'starter';
    const transactionId = data.transaction_id || data.order_id || data.id;

    // Parse plan tier and billing period from product name
    // Expected formats: "Basic Monthly", "Pro Yearly", "Growth Monthly", etc.
    const planTier = parsePlanTier(productName);
    const billingPeriod = parseBillingPeriod(productName);

    // Validate required fields
    if (!contactEmail || !domain) {
      console.error('Missing required fields:', { contactEmail, domain });
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email and website domain required',
          received: { contactEmail, domain }
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Clean domain
    const cleanDomain = domain
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

    // CHECK FOR DUPLICATES: Prevent multiple emails to same domain within 24 hours
    const { data: recentEmail } = await supabase
      .from('widget_automation_log')
      .select('id, email_sent_at, email_status')
      .eq('domain', cleanDomain)
      .eq('email_sent', true)
      .gte('email_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('email_sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentEmail) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Duplicate prevention: Email already sent to this domain within 24 hours',
          log_id: recentEmail.id,
          previously_sent_at: recentEmail.email_sent_at,
          duplicate_prevented: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Log the automation request
    const { data: logEntry, error: logError } = await supabase
      .from('widget_automation_log')
      .insert({
        trigger_source: 'groove',
        trigger_id: transactionId,
        contact_email: contactEmail.toLowerCase().trim(),
        contact_name: contactName || contactEmail.split('@')[0],
        business_name: companyName || contactName || 'Unknown Business',
        domain: cleanDomain,
        plan_tier: planTier || 'starter',
        email_status: automationEnabled ? 'pending' : 'paused'
      })
      .select()
      .single();

    if (logError) throw logError;

    // If automation is disabled, just log and return
    if (!automationEnabled) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Automation paused - request logged but email not sent',
          log_id: logEntry.id
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('domain', cleanDomain)
      .maybeSingle();

    let clientId = existingClient?.id;

    // Create client if doesn't exist
    if (!clientId) {
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: companyName || contactName || 'Unknown Business',
          domain: cleanDomain,
          contact_email: contactEmail,
          contact_name: contactName || contactEmail.split('@')[0],
          contact_phone: phoneNumber,
          plan_tier: planTier || 'starter',
          active: true,
          agency_name: 'SwiftImpact Solutions',
          cta_url: 'https://swiftimpactsolutions.com/ada',
          widget_position: 'bottom-left',
          primary_color: '#007bff',
          automation_trigger: 'groove',
          automation_trigger_id: transactionId,
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
    const embedCode = `<script>!function(){var s=document.createElement("script");s.src="${cdnDomain}/loader.js?v=2";s.setAttribute("data-domain","${cleanDomain}");s.async=!0;document.body.appendChild(s)}();</script>`;

    // Get email template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template')
      .maybeSingle();
    
    let emailTemplate = {
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
      .replace(/\{\{first_name\}\}/g, firstName || contactName.split(' ')[0] || 'There')
      .replace(/\{\{last_name\}\}/g, lastName || '')
      .replace(/\{\{business_name\}\}/g, companyName || contactName || 'Your Business')
      .replace(/\{\{company_name\}\}/g, companyName || contactName || 'Your Business')
      .replace(/\{\{domain\}\}/g, cleanDomain)
      .replace(/\{\{plan_tier\}\}/g, planTier)
      .replace(/\{\{billing_period\}\}/g, billingPeriod)
      .replace(/\{\{embed_code\}\}/g, embedCode);

    // Get SMTP settings
    const { data: smtpData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_settings')
      .maybeSingle();
    
    const smtpSettings = smtpData?.value 
      ? (typeof smtpData.value === 'string' ? JSON.parse(smtpData.value) : smtpData.value)
      : {};

    // Send email if SMTP is configured
    if (smtpSettings.smtpHost && smtpSettings.smtpUser && smtpSettings.smtpPass) {
      const emailResult = await sendEmail({
        to: contactEmail,
        subject: emailTemplate.subject,
        htmlBody: emailHtml,
        smtpSettings: smtpSettings
      });

      if (emailResult.success) {
        // Update log and client
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

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Widget delivered successfully',
            client_id: clientId,
            log_id: logEntry.id,
            email_sent: true
          }),
          headers: { 'Content-Type': 'application/json' }
        };
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } else {
      // SMTP not configured - log but don't send
      await supabase
        .from('widget_automation_log')
        .update({
          client_id: clientId,
          email_status: 'pending',
          error_message: 'SMTP not configured'
        })
        .eq('id', logEntry.id);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Client created but email not sent (SMTP not configured)',
          client_id: clientId,
          log_id: logEntry.id,
          email_sent: false
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

  } catch (error) {
    console.error('Groove IPN error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

// Send email via SMTP
async function sendEmail({ to, subject, htmlBody, smtpSettings }) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpSettings.smtpHost,
      port: parseInt(smtpSettings.smtpPort) || 587,
      secure: (parseInt(smtpSettings.smtpPort) || 587) === 465,
      auth: {
        user: smtpSettings.smtpUser,
        pass: smtpSettings.smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"${smtpSettings.fromName || 'SwiftImpact Solutions'}" <${smtpSettings.fromEmail || smtpSettings.smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlBody
    });

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Parse plan tier from product name (e.g., "Pro Monthly" -> "Pro")
function parsePlanTier(productName) {
  if (!productName) return 'starter';
  const name = productName.toLowerCase();
  
  if (name.includes('basic')) return 'Basic';
  if (name.includes('starter')) return 'Starter';
  if (name.includes('pro')) return 'Pro';
  if (name.includes('growth')) return 'Growth';
  if (name.includes('enterprise')) return 'Enterprise';
  
  return 'Starter'; // default
}

// Parse billing period from product name (e.g., "Pro Monthly" -> "Monthly")
function parseBillingPeriod(productName) {
  if (!productName) return 'Monthly';
  const name = productName.toLowerCase();
  
  if (name.includes('yearly') || name.includes('annual')) return 'Yearly';
  if (name.includes('monthly')) return 'Monthly';
  
  return 'Monthly'; // default
}

// Default email template
const defaultEmailTemplate = `<!DOCTYPE html>
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
      <h2>Hi {{contact_name}},</h2>
      <p>Your ADA compliance widget for <strong>{{business_name}}</strong> has been created and is ready to install.</p>
      
      <h3>📋 Installation Instructions</h3>
      <p>Copy this code and paste it just before the closing &lt;/body&gt; tag on your website:</p>
      
      <div class="code-block">{{embed_code}}</div>
      
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
      <p><strong>{{plan_tier}}</strong> - {{billing_period}} Billing</p>
      
      <h3>🏢 Company</h3>
      <p><strong>{{company_name}}</strong></p>
      
      <h3>Need Help?</h3>
      <p>Reply to this email or contact us at support@swiftimpactsolutions.com</p>
    </div>
    <div class="footer">
      <p>Powered by SwiftImpact Solutions | Making the web accessible for everyone</p>
    </div>
  </div>
</body>
</html>`;
