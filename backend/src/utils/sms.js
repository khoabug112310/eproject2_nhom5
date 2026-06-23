// Utility: SMS Sender & Twilio Verify Integration
const https = require('https');
const querystring = require('querystring');

/**
 * Sends an SMS message using standard Twilio Messaging API.
 * 
 * @param {string} phone - Target phone number (e.g. 0912345678 or +84912345678)
 * @param {string} message - Text content of the SMS
 * @returns {Promise<{success: boolean, error?: any, response?: any}>}
 */
const sendSMS = async (phone, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[TWILIO SMS] Warning: Twilio credentials or phone number are missing.');
    return { success: false, error: 'Missing Twilio configuration' };
  }

  // Format phone number to E.164 (+84...)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+84' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  const postData = querystring.stringify({
    To: formattedPhone,
    From: fromNumber,
    Body: message,
  });

  return new Promise((resolve) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, response: parsed });
          } else {
            console.error('[SMS ERROR] Twilio returned error:', parsed);
            resolve({ success: false, error: parsed });
          }
        } catch (e) {
          resolve({ success: false, error: `Failed to parse response: ${body}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[SMS ERROR] Request error:', e);
      resolve({ success: false, error: e });
    });
    
    req.write(postData);
    req.end();
  });
};

/**
 * Sends a verification code using Twilio Verify API.
 * 
 * @param {string} phone - Target phone number
 * @returns {Promise<{success: boolean, error?: any, response?: any}>}
 */
const sendVerifyOTP = async (phone) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    console.warn('[TWILIO VERIFY] Warning: Twilio credentials or service SID are missing.');
    return { success: false, error: 'Missing Twilio configuration' };
  }

  // Format phone number to E.164 (+84...)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+84' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  const postData = querystring.stringify({
    To: formattedPhone,
    Channel: 'sms',
    Locale: 'en',
  });

  return new Promise((resolve) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const options = {
      hostname: 'verify.twilio.com',
      port: 443,
      path: `/v2/Services/${serviceSid}/Verifications`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, response: parsed });
          } else {
            console.error('[TWILIO VERIFY ERROR] Twilio returned error:', parsed);
            resolve({ success: false, error: parsed });
          }
        } catch (e) {
          resolve({ success: false, error: `Failed to parse response: ${body}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[TWILIO VERIFY ERROR] Request error:', e);
      resolve({ success: false, error: e });
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Checks a verification code using Twilio Verify API.
 * 
 * @param {string} phone - Target phone number
 * @param {string} code - The OTP code inputted by user
 * @returns {Promise<{success: boolean, error?: any, response?: any}>}
 */
const checkVerifyOTP = async (phone, code) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    console.warn('[TWILIO VERIFY CHECK] Warning: Twilio credentials or service SID are missing.');
    return { success: false, error: 'Missing Twilio configuration' };
  }

  // Format phone number to E.164 (+84...)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+84' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  const postData = querystring.stringify({
    To: formattedPhone,
    Code: code,
  });

  return new Promise((resolve) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const options = {
      hostname: 'verify.twilio.com',
      port: 443,
      path: `/v2/Services/${serviceSid}/VerificationCheck`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (parsed.status === 'approved' || parsed.valid === true) {
              resolve({ success: true, response: parsed });
            } else {
              resolve({ success: false, response: parsed });
            }
          } else {
            console.error('[TWILIO VERIFY CHECK ERROR] Twilio returned error:', parsed);
            resolve({ success: false, error: parsed });
          }
        } catch (e) {
          resolve({ success: false, error: `Failed to parse response: ${body}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[TWILIO VERIFY CHECK ERROR] Request error:', e);
      resolve({ success: false, error: e });
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  sendSMS,
  sendVerifyOTP,
  checkVerifyOTP
};
