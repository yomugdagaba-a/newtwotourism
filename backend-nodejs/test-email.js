// Quick email test — run this on Render Shell:
// node test-email.js your@email.com
require('dotenv').config();
const { Resend } = require('resend');

const to = process.argv[2] || 'test@example.com';
const apiKey = process.env.RESEND_API_KEY;
const from = (process.env.SMTP_FROM || '').replace(/^["']|["']$/g, '').trim() || 'North Wollo Tourism <onboarding@resend.dev>';

console.log('=== Email Test ===');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
console.log('From:', from);
console.log('To:', to);

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is not set');
  process.exit(1);
}

const resend = new Resend(apiKey);

resend.emails.send({
  from,
  to,
  subject: 'Test Email — North Wollo Tourism',
  html: `<h2>Test Email</h2><p>Sent at: ${new Date().toISOString()}</p><p>If you received this, email is working!</p>`,
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ Resend error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
  console.log('✅ Email sent successfully!');
  console.log('Resend ID:', data?.id);
}).catch(err => {
  console.error('❌ Exception:', err.message);
  process.exit(1);
});
