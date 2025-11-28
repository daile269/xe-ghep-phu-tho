const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase admin
admin.initializeApp();

// Read SMTP configuration from functions config (set via `firebase functions:config:set`)
const SMTP_USER = functions.config().smtp && functions.config().smtp.user ? functions.config().smtp.user : null;
const SMTP_PASS = functions.config().smtp && functions.config().smtp.pass ? functions.config().smtp.pass : null;
const FROM_EMAIL = functions.config().smtp && functions.config().smtp.from ? functions.config().smtp.from : 'no-reply@yourdomain.com';
const ADMIN_EMAIL = functions.config().admin && functions.config().admin.email ? functions.config().admin.email : null;

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
} else {
  console.warn('SMTP credentials not configured (functions config smtp.user/smtp.pass). Emails will be skipped.');
}

exports.sendRideCreatedEmail = functions.database.ref('/rides/{rideId}')
  .onCreate(async (snapshot, context) => {
    const ride = snapshot.val();
    const rideId = context.params.rideId;

    if (!transporter) {
      console.log(`Skipping email for ride ${rideId} because SMTP is not configured.`);
      return null;
    }

    if (!ADMIN_EMAIL) {
      console.log(`Skipping email for ride ${rideId} because admin email is not configured (functions config admin.email).`);
      return null;
    }

    const subject = `New ride posted: ${ride.origin || ''} → ${ride.destination || ''}`;
    const textLines = [];
    textLines.push(`Ride ID: ${rideId}`);
    textLines.push(`Driver: ${ride.driverName || ride.driverId || 'Unknown'}`);
    if (ride.driverPhone) textLines.push(`Driver Phone: ${ride.driverPhone}`);
    if (ride.departureTime) textLines.push(`Departure: ${ride.departureTime}`);
    if (ride.price !== undefined) textLines.push(`Price: ${ride.price} VND`);
    if (ride.seatsTotal !== undefined) textLines.push(`Seats: ${ride.seatsTotal}`);
    if (ride.description) textLines.push(`Description: ${ride.description}`);

    const text = textLines.join('\n');

    const html = `
      <h2>New ride posted</h2>
      <p><strong>Ride ID:</strong> ${rideId}</p>
      <p><strong>Driver:</strong> ${ride.driverName || ride.driverId || 'Unknown'}</p>
      ${ride.driverPhone ? `<p><strong>Driver Phone:</strong> ${ride.driverPhone}</p>` : ''}
      ${ride.departureTime ? `<p><strong>Departure:</strong> ${ride.departureTime}</p>` : ''}
      ${ride.price !== undefined ? `<p><strong>Price:</strong> ${ride.price} VND</p>` : ''}
      ${ride.seatsTotal !== undefined ? `<p><strong>Seats:</strong> ${ride.seatsTotal}</p>` : ''}
      ${ride.description ? `<p><strong>Description:</strong> ${ride.description}</p>` : ''}
      <p><a href="">Open Admin Dashboard</a></p>
    `;

    const mailOptions = {
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text,
      html
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent for ride ${rideId} to ${ADMIN_EMAIL}`);
    } catch (err) {
      console.error('Error sending email', err);
    }

    return null;
  });

// When a ride is updated from a non-OPEN state to OPEN (admin approved),
// send an email to the driver if the driver is registered and approved.
exports.sendRideApprovedEmail = functions.database.ref('/rides/{rideId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    const rideId = context.params.rideId;

    if (!before || !after) return null;

    // Only act when status transitions to OPEN
    if (before.status === after.status) return null;
    if (after.status !== 'OPEN') return null;

    if (!transporter) {
      console.log(`Skipping driver email for ride ${rideId} because SMTP is not configured.`);
      return null;
    }

    const driverId = after.driverId;
    if (!driverId) {
      console.log(`Ride ${rideId} has no driverId, skipping approved-email.`);
      return null;
    }

    try {
      const userSnap = await admin.database().ref(`users/${driverId}`).once('value');
      const driver = userSnap.val();
      if (!driver) {
        console.log(`Driver ${driverId} not found for ride ${rideId}`);
        return null;
      }

      // Only notify if driver is explicitly allowed (isDriver true and driverStatus === 'APPROVED')
      if (!driver.isDriver || driver.driverStatus !== 'APPROVED') {
        console.log(`Driver ${driverId} is not an approved driver, skipping email.`);
        return null;
      }

      const toEmail = driver.email;
      if (!toEmail) {
        console.log(`Driver ${driverId} does not have an email address, skipping.`);
        return null;
      }

      const subject = `Chuyến của bạn đã được duyệt — ${after.origin || ''} → ${after.destination || ''}`;
      const text = `Chuyến (ID: ${rideId}) của khách đăng ký vừa được quản trị viên duyệt, hãy nhận chuyến nhé.\n\n` +
        `Lộ trình: ${after.origin} → ${after.destination}\n` +
        `Thời gian: ${after.departureTime}\n` +
        `Giá: ${after.price} VND\n` +
        `Ghế: ${after.seatsAvailable}/${after.seatsTotal}\n` +
        `Cảm ơn bạn đã sử dụng hệ thống.`;

      const html = `
        <h2>Chuyến của bạn đã được duyệt</h2>
        <p><strong>Ride ID:</strong> ${rideId}</p>
        <p><strong>Lộ trình:</strong> ${after.origin} → ${after.destination}</p>
        <p><strong>Thời gian:</strong> ${after.departureTime}</p>
        <p><strong>Giá:</strong> ${after.price} VND</p>
        <p><strong>Ghế:</strong> ${after.seatsAvailable}/${after.seatsTotal}</p>
        <p>Chúc chuyến đi suôn sẻ!</p>
      `;

      const mailOptions = {
        from: FROM_EMAIL,
        to: toEmail,
        subject,
        text,
        html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Sent approval email for ride ${rideId} to driver ${driverId} <${toEmail}>`);
    } catch (err) {
      console.error('Error sending approval email to driver', err);
    }

    return null;
  });
