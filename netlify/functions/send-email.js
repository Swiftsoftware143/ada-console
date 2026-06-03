// Netlify Function to send emails using SMTP
// This keeps SMTP credentials secure on the server side

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { to, from, fromName, subject, html, text, smtpConfig } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !subject || !smtpConfig) {
      return {
        statusCode: 400,
        body: 'Missing required fields: to, subject, smtpConfig'
      };
    }

    // Validate SMTP config
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      return {
        statusCode: 400,
        body: 'Missing SMTP configuration'
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port || 587,
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"${fromName || 'ADA Swift'}" <${from || smtpConfig.username}>`,
      to: to,
      subject: subject,
      text: text || '',
      html: html || '',
    });

    console.log('Email sent:', info.messageId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
      }),
    };

  } catch (error) {
    console.error('Email send error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
