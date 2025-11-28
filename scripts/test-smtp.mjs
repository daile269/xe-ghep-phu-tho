import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const TO_EMAIL = process.env.ADMIN_EMAIL || process.argv[2];

if (!SMTP_USER || !SMTP_PASS) {
  console.error('Missing SMTP_USER or SMTP_PASS in .env');
  process.exit(1);
}
if (!TO_EMAIL) {
  console.error('No destination email set. Set ADMIN_EMAIL in .env or pass as arg: node scripts/test-smtp.mjs you@domain.tld');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

(async () => {
  try {
    console.log('Sending test email', { from: FROM_EMAIL, to: TO_EMAIL });
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: 'Test email from xe-ghep-phu-tho',
      text: `This is a test email sent at ${new Date().toISOString()}`,
    });
    console.log('sendMail result:', info);
    // Helpful fields:
    console.log('accepted:', info.accepted);
    console.log('rejected:', info.rejected);
    console.log('messageId:', info.messageId);
    console.log('response:', info.response);
  } catch (err) {
    console.error('Error sending test email:', err);
    process.exit(2);
  }
})();
