const nodemailer = require('nodemailer');

/**
 * Simple serverless email endpoint for Vercel/Netlify-like platforms.
 * - POST /api/send-email
 * Body: { type: 'ride_created'|'ride_approved', payload: {...} }
 * Environment variables required:
 *   SMTP_USER, SMTP_PASS, FROM_EMAIL, ADMIN_EMAIL
 */

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, payload } = req.body || {};

  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('SMTP credentials not set');
    return res.status(500).json({ error: 'SMTP credentials not configured' });
  }

  if (!type || !payload) {
    return res.status(400).json({ error: 'Missing type or payload' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    if (type === 'ride_created') {
      if (!ADMIN_EMAIL) return res.status(500).json({ error: 'ADMIN_EMAIL not configured' });

      const { rideId, origin, destination, driverName, driverPhone, departureTime, price } = payload;
      const subject = `New ride posted: ${origin || ''} → ${destination || ''}`;
      const text = `Ride ID: ${rideId}\nDriver: ${driverName || 'Unknown'}\nPhone: ${driverPhone || ''}\nDeparture: ${departureTime || ''}\nPrice: ${price || ''}`;

      await transporter.sendMail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        text
      });

      return res.status(200).json({ ok: true, message: 'Admin notified' });
    }

    if (type === 'ride_approved') {
      const { rideId, origin, destination, driverId, driverEmail, departureTime, price } = payload;
      if (!driverEmail) return res.status(400).json({ error: 'driverEmail required for ride_approved' });

      const subject = `Chuyến của bạn đã được duyệt — ${origin || ''} → ${destination || ''}`;
      const text = `Chuyến (ID: ${rideId}) của bạn đã được quản trị viên duyệt.\nLộ trình: ${origin} → ${destination}\nThời gian: ${departureTime || ''}\nGiá: ${price || ''}`;

      await transporter.sendMail({
        from: FROM_EMAIL,
        to: driverEmail,
        subject,
        text
      });

      return res.status(200).json({ ok: true, message: 'Driver notified' });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    console.error('Error sending email', err);
    return res.status(500).json({ error: String(err) });
  }
};
