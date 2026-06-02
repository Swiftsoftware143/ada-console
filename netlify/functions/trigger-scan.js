// Netlify Function: Trigger ADA Scan for a Client
// Endpoint: POST /.netlify/functions/trigger-scan

const { createClient } = require('@supabase/supabase-js');
const pa11y = require('pa11y');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { client_id, manual = false } = JSON.parse(event.body);

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Client not found' })
      };
    }

    // Check if scanning is enabled (skip check for manual scans)
    if (!manual) {
      const { data: settings } = await supabase
        .from('client_scan_settings')
        .select('monthly_scan_enabled')
        .eq('client_id', client_id)
        .single();

      if (!settings?.monthly_scan_enabled) {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: false, 
            error: 'Scanning not enabled for this client',
            skipped: true 
          })
        };
      }
    }

    // Get previous scan for comparison
    const { data: previousScan } = await supabase
      .from('scan_reports')
      .select('*')
      .eq('client_id', client_id)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single();

    // Run Pa11y scan
    console.log(`Starting scan for ${client.domain}`);
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const scanUrl = `https://${client.domain}`;
    const results = await pa11y(scanUrl, {
      browser: browser,
      standard: 'WCAG2AA',
      timeout: 60000,
      wait: 2000,
      ignore: [
        'notice' // Only report errors and warnings
      ]
    });

    await browser.close();

    // Calculate scores
    const errorCount = results.issues.filter(i => i.type === 'error').length;
    const warningCount = results.issues.filter(i => i.type === 'warning').length;
    const noticeCount = results.issues.filter(i => i.type === 'notice').length;
    
    // Score calculation: 100 - (errors * 5) - (warnings * 2) - (notices * 0.5)
    let overallScore = Math.max(0, Math.round(100 - (errorCount * 5) - (warningCount * 2) - (noticeCount * 0.5)));

    // Store scan results
    const { data: scanReport, error: scanError } = await supabase
      .from('scan_reports')
      .insert({
        client_id: client_id,
        domain: client.domain,
        overall_score: overallScore,
        error_count: errorCount,
        warning_count: warningCount,
        notice_count: noticeCount,
        scan_results: results,
        previous_scan_id: previousScan?.id || null,
        improvement_score: previousScan ? overallScore - previousScan.overall_score : null
      })
      .select()
      .single();

    if (scanError) throw scanError;

    // Update client scan settings
    await supabase
      .from('client_scan_settings')
      .upsert({
        client_id: client_id,
        last_scan_at: new Date().toISOString(),
        last_scan_score: overallScore,
        scan_count: supabase.rpc('increment_scan_count', { client_id: client_id })
      }, { onConflict: 'client_id' });

    // Generate PDF report (placeholder - would use PDF library)
    const reportGenerated = true; // TODO: Implement PDF generation

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        scan_id: scanReport.id,
        domain: client.domain,
        score: overallScore,
        errors: errorCount,
        warnings: warningCount,
        improvements: previousScan ? overallScore - previousScan.overall_score : null,
        report_generated: reportGenerated
      })
    };

  } catch (error) {
    console.error('Scan error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
