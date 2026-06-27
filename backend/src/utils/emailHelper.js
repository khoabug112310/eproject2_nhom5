const nodemailer = require('nodemailer');
const env = require('../config/env');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Clean application password (remove spaces)
const smtpEmail = env.SMTP_EMAIL;
const smtpPassword = env.SMTP_PASSWORD ? env.SMTP_PASSWORD.replace(/\s+/g, '') : '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpEmail,
    pass: smtpPassword,
  },
});

/**
 * Sends a reply email to a patient's feedback inquiry
 * @param {string} toEmail 
 * @param {string} patientName 
 * @param {string} inquiryMessage 
 * @param {string} replyMessage 
 */
async function sendReplyEmail(toEmail, patientName, inquiryMessage, replyMessage) {
  const mailOptions = {
    from: `"Hopsontai Clinic Customer Care" <${smtpEmail}>`,
    to: toEmail,
    subject: '[Hopsontai Clinic] Response to your feedback / inquiry',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 700;">Hopsontai General Clinic</h2>
          <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Customer Service & Support</span>
        </div>

        <!-- Greeting -->
        <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
          Dear <strong>${patientName || 'Valued Patient'}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
          Thank you for sharing your feedback with us. Below is the detailed response from our customer service department:
        </p>
        
        <!-- Original Inquiry Section -->
        <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Your Feedback:</strong>
          <p style="margin: 8px 0 0 0; color: #334155; font-size: 14.5px; line-height: 1.5; font-style: italic; white-space: pre-wrap;">"${escapeHtml(inquiryMessage)}"</p>
        </div>

        <!-- Support Reply Section -->
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong style="color: #0f766e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Support Response:</strong>
          <p style="margin: 8px 0 0 0; color: #115e59; font-size: 15px; line-height: 1.6; font-weight: 500; white-space: pre-wrap;">${escapeHtml(replyMessage)}</p>
        </div>

        <!-- Contact/Footer Info -->
        <p style="font-size: 14px; line-height: 1.6; margin-top: 25px; color: #475569;">
          If you have any further questions or require additional assistance, please feel free to reply directly to this email or contact our hotline: <strong style="color: #0d9488;">1900 6868</strong>.
        </p>
        
        <!-- Signature -->
        <div style="border-top: 1px solid #e2e8f0; margin-top: 25px; padding-top: 15px;">
          <p style="font-size: 13px; color: #64748b; margin: 0;">Best regards,</p>
          <p style="font-size: 14px; font-weight: bold; color: #0d9488; margin: 5px 0 0 0;">Customer Care Team</p>
          <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">Hopsontai General Clinic</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendReplyEmail,
};
