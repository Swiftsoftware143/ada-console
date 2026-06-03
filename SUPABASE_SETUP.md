# Supabase Setup for ADA Swift Console

## Overview
This document describes what needs to be configured in Supabase for the ADA Swift Console to work properly.

## Required Tables

### 1. `settings` Table
This table stores all configuration values including SMTP credentials and email templates.

**Schema:**
```sql
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.settings enable row level security;

-- Allow authenticated users to read settings
create policy "Allow authenticated read" on public.settings
  for select to authenticated using (true);

-- Allow authenticated users to insert/update settings
create policy "Allow authenticated insert" on public.settings
  for insert to authenticated with check (true);

create policy "Allow authenticated update" on public.settings
  for update to authenticated using (true);
```

## Required Settings Keys

The following settings keys are used by the application:

### SMTP Configuration (Set via Settings page)
| Key | Description | Example Value |
|-----|-------------|---------------|
| `smtp_host` | SMTP server hostname | `smtp.mailgun.org` |
| `smtp_port` | SMTP server port | `587` or `465` |
| `smtp_username` | SMTP username | `postmaster@yourdomain.com` |
| `smtp_password` | SMTP password or API key | `your-mailgun-api-key` |
| `smtp_secure` | Use SSL/TLS (true/false) | `false` for STARTTLS, `true` for SSL |

### Email Templates (Set via Email Templates page)
| Key | Description | Default |
|-----|-------------|---------|
| `email_from_address` | From email address | `hello@swiftimpactsolutions.com` |
| `email_from_name` | From name | `SwiftImpact Solutions` |
| `email_subject` | Email subject template | `Your ADA Widget is Ready - {{business_name}}` |
| `email_template_html` | HTML email body template | See default in EmailTemplates.jsx |
| `email_template_text` | Plain text email body template | See default in EmailTemplates.jsx |

### Other Settings
| Key | Description | Example |
|-----|-------------|---------|
| `cdn_domain` | Widget loader CDN domain | `https://adaswift.netlify.app` |
| `agency_name` | Default agency name | `SwiftImpact Solutions` |
| `cta_url` | Default CTA URL | `https://swiftimpactsolutions.com/ada` |
| `tags` | Comma-separated list of tags | `Medical, Local Business, E-commerce` |

## Available Template Variables

When editing email templates, you can use these variables:

| Variable | Description |
|----------|-------------|
| `{{business_name}}` | Business/company name |
| `{{contact_name}}` | Contact person's name |
| `{{contact_email}}` | Contact email address |
| `{{domain}}` | Website domain |
| `{{plan_tier}}` | Plan tier (Basic/Pro/Enterprise) |
| `{{widget_id}}` | Unique widget ID |
| `{{embed_code}}` | Full embed code (escaped in HTML) |
| `{{{embed_code}}}` | Full embed code (HTML-escaped for display) |
| `{{agency_name}}` | Your agency name from settings |

## Mailgun Setup Example

1. Sign up at https://www.mailgun.com/
2. Add your domain (e.g., `swiftimpactsolutions.com`)
3. Get your SMTP credentials from the Mailgun dashboard
4. In the ADA Swift Console Settings page:
   - **SMTP Host**: `smtp.mailgun.org`
   - **SMTP Port**: `587` (or `465` for SSL)
   - **SMTP Username**: `postmaster@yourdomain.com` (from Mailgun)
   - **SMTP Password**: Your Mailgun SMTP password (not the API key)
   - **Use SSL/TLS**: Uncheck for port 587, check for port 465

## Testing Email Delivery

After configuring SMTP:

1. Go to Widget Requests
2. Create a test widget request with your email
3. Click "Deliver" 
4. Check your email inbox

If emails aren't sending:
- Check browser console for errors
- Check Netlify function logs
- Verify SMTP credentials in Settings
- Ensure the `send-email` Netlify function deployed successfully

## Security Notes

- SMTP credentials are stored encrypted in Supabase
- The actual email sending happens via Netlify function (server-side)
- Credentials are never exposed to the browser
- Always use environment-specific credentials (don't use production SMTP in dev)
