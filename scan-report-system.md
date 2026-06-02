# ADA Scan Report System - Architecture

## Overview
Automated monthly ADA compliance scanning using Pa11y, with PDF report generation and email delivery.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADASwift Console                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Scan Report │  │ Client      │  │ Toggle All /        │  │
│  │ Dashboard   │  │ Toggles     │  │ Individual Controls │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
└─────────┼────────────────┼───────────────────────────────────┘
          │                │
          │                ▼
          │    ┌─────────────────────┐
          │    │  client_scan_settings│
          │    │  - client_id         │
          │    │  - monthly_scan_enabled│
          │    │  - last_scan_date    │
          │    │  - last_scan_score   │
          │    └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Monthly Cron Job (1st of month)                            │
│  - Get all clients with scan_enabled = true                 │
│  - Queue scan jobs                                          │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Pa11y Scanner (Self-hosted)                                │
│  - Crawls client website                                    │
│  - Checks WCAG 2.1 AA                                       │
│  - Returns JSON results                                     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Report Generator                                           │
│  - Generates PDF with SwiftImpact branding                  │
│  - Calculates compliance score                              │
│  - Compares with previous scan                              │
│  - Stores in Supabase Storage                               │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Email Delivery                                             │
│  - Sends PDF to client                                      │
│  - CC to you (optional)                                     │
│  - Logs delivery status                                     │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### client_scan_settings
```sql
CREATE TABLE client_scan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  monthly_scan_enabled boolean DEFAULT false,
  scan_frequency text DEFAULT 'monthly', -- monthly, weekly, never
  last_scan_at timestamptz,
  last_scan_score integer, -- 0-100
  last_scan_report_url text,
  scan_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);
```

### scan_reports
```sql
CREATE TABLE scan_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  scan_date timestamptz DEFAULT now(),
  domain text NOT NULL,
  overall_score integer, -- 0-100
  wcag_aa_score integer,
  error_count integer,
  warning_count integer,
  notice_count integer,
  report_url text, -- Supabase storage URL
  report_pdf_path text, -- Storage path
  scan_results jsonb, -- Full Pa11y results
  previous_scan_id uuid REFERENCES scan_reports(id),
  improvement_score integer, -- Change from previous
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Pa11y Configuration

### Installation
```bash
npm install pa11y pa11y-ci puppeteer
```

### Scan Settings
- Standard: WCAG 2.1 AA
- Timeout: 60 seconds per page
- Wait: 1000ms (for JS to load)
- Ignore: [] (can add rules to skip)
- Threshold: 0 (report all issues)

## Report PDF Sections

1. **Cover Page**
   - SwiftImpact branding
   - Client name & domain
   - Scan date
   - Overall score (0-100)

2. **Executive Summary**
   - Score with color coding
   - Issues breakdown (errors/warnings/notices)
   - Comparison to previous scan
   - Trend arrow (improving/declining)

3. **Detailed Findings**
   - Grouped by severity
   - Each issue:
     - Description
     - WCAG guideline reference
     - Code snippet
     - How to fix
     - Screenshot (optional)

4. **Recommendations**
   - Priority fixes
   - Estimated effort
   - SwiftImpact services pitch

## Email Template

Subject: Your Monthly ADA Compliance Report - [Domain]

Body:
- Greeting with first name
- Overall score with visual
- Key findings summary
- PDF attachment
- CTA to schedule fixes

## Cron Schedule

```
0 9 1 * *  # 9 AM on 1st of every month
```

## API Endpoints

### Trigger Manual Scan
```
POST /.netlify/functions/trigger-scan
Body: { client_id }
```

### Get Scan History
```
GET /.netlify/functions/scan-history?client_id=xxx
```

### Download Report
```
GET /.netlify/functions/download-report?report_id=xxx
```

## Toggle All Feature

```javascript
// Toggle all clients
const toggleAll = async (enabled) => {
  await supabase
    .from('client_scan_settings')
    .update({ monthly_scan_enabled: enabled });
};
```

## Cost Estimate

- Pa11y: FREE (self-hosted)
- Supabase Storage: ~$0 (reports are small PDFs)
- Compute: Included in Netlify functions
- Email: Uses existing Mailgun

**Total: $0/month**
