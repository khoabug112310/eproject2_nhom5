// Utility: Email Sender (Nodemailer SMTP Integration with Dev Simulation Mode)
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter = null;

if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    pool: true, // Enable connection pooling
    maxConnections: 5, // Limit open connections to Google SMTP
    maxMessages: 100, // Reuse connection for up to 100 emails before reopening
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends an email using Nodemailer.
 * Automatically checks for SMTP credentials. If not set, logs the email details in console.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} html - HTML content
 * @param {string} text - Plain text body of the email
 * @returns {Promise<{success: boolean, simulated?: boolean, response?: any}>}
 */
const sendEmail = async (to, subject, html, text = '') => {
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION - DEV MODE]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message (HTML): "${html.substring(0, 100)}..."`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: `"Hopsontai Clinic" <${smtpUser}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[EMAIL ERROR] Failed to send email:', error);
        reject(error);
      } else {
        resolve({ success: true, response: info });
      }
    });
  });
};

module.exports = { sendEmail };
