import nodemailer from "nodemailer";

/**
 * Simple serverless email endpoint for Vercel/Netlify-like platforms.
 * - POST /api/send-email
 * Body: { type: 'ride_created'|'ride_approved', payload: {...} }
 * Environment variables required:
 *   SMTP_USER, SMTP_PASS, FROM_EMAIL, ADMIN_EMAIL
 */

export default async function handler(req, res) {
  // CORS: allow requests from browser clients. You can set CORS_ORIGIN in env
  // to restrict allowed origins. Default to '*' for convenience during development.
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
  const setCors = () => {
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    setCors();
    return res.status(204).end();
  }

  // Only POST is meaningful for this endpoint
  if (req.method !== "POST") {
    setCors();
    return res.status(405).json({ error: "Method not allowed" });
  }
  setCors();

  const { type, payload } = req.body || {};

  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if (!SMTP_USER || !SMTP_PASS) {
    console.error("SMTP credentials not set");
    return res.status(500).json({ error: "SMTP credentials not configured" });
  }

  if (!type || !payload) {
    return res.status(400).json({ error: "Missing type or payload" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    if (type === "ride_created") {
      if (!ADMIN_EMAIL)
        return res.status(500).json({ error: "ADMIN_EMAIL not configured" });

      const {
        rideId,
        origin,
        destination,
        driverName,
        driverPhone,
        departureTime,
        price,
      } = payload;
      const subject = `New ride posted: ${origin || ""} → ${destination || ""}`;
      const text = `Ride ID: ${rideId}\nDriver: ${
        driverName || "Unknown"
      }\nPhone: ${driverPhone || ""}\nDeparture: ${
        departureTime || ""
      }\nPrice: ${price || ""}`;

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        text,
      });

      return res
        .status(200)
        .json({ ok: true, message: "Admin notified", info });
    }

    if (type === "ride_approved") {
      const {
        rideId,
        origin,
        destination,
        driverId,
        driverEmail,
        departureTime,
        price,
      } = payload;
      if (!driverEmail)
        return res
          .status(400)
          .json({ error: "driverEmail required for ride_approved" });

      const subject = `Chuyến của bạn đã được duyệt — ${origin || ""} → ${
        destination || ""
      }`;
      const text = `Chuyến (ID: ${rideId}) của bạn đã được quản trị viên duyệt.\nLộ trình: ${origin} → ${destination}\nThời gian: ${
        departureTime || ""
      }\nGiá: ${price || ""}`;

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: driverEmail,
        subject,
        text,
      });

      return res
        .status(200)
        .json({ ok: true, message: "Driver notified", info });
    }

    if (type === "driver_registered") {
      if (!ADMIN_EMAIL)
        return res.status(500).json({ error: "ADMIN_EMAIL not configured" });

      const {
        userId,
        name,
        phone,
        email,
        carModel,
        licensePlate,
        licenseNumber,
      } = payload;
      const subject = `Tài xế mới đăng ký: ${name || phone}`;
      const text = `Có tài xế mới cần duyệt:\n\nUser ID: ${userId}\nTên: ${
        name || "Chưa cập nhật"
      }\nSĐT: ${phone}\nEmail: ${email || "Không có"}\nXe: ${
        carModel || ""
      }\nBiển số: ${licensePlate || ""}\nGPLX: ${
        licenseNumber || ""
      }\n\nVui lòng vào hệ thống để duyệt.`;

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        text,
      });

      return res
        .status(200)
        .json({
          ok: true,
          message: "Admin notified of driver registration",
          info,
        });
    }

    if (type === "ride_request_created") {
      if (!ADMIN_EMAIL)
        return res.status(500).json({ error: "ADMIN_EMAIL not configured" });

      const {
        requestId,
        passengerName,
        passengerPhone,
        origin,
        destination,
        pickupTime,
        priceOffered,
        referrerId,
        referralFee,
        rideType,
        seatsNeeded,
      } = payload;

      let subject = `Yêu cầu chuyến đi mới: ${origin || ""} → ${
        destination || ""
      }`;
      let text = `Có yêu cầu chuyến đi mới cần duyệt:\n\nID: ${requestId}\nKhách: ${
        passengerName || "Chưa có tên"
      }\nSĐT: ${passengerPhone}\nTừ: ${origin}\nĐến: ${destination}\nGiờ đón: ${
        pickupTime || ""
      }\nGiá đề nghị: ${priceOffered || 0} VNĐ\nLoại xe: ${
        rideType || ""
      }\nSố ghế: ${seatsNeeded || 1}`;

      // Nếu có thông tin bắn khách
      if (referrerId && referralFee) {
        subject = `🎯 BẮN KHÁCH: ${origin || ""} → ${destination || ""}`;
        text += `\n\n⚠️ ĐÂY LÀ CHUYẾN BẮN KHÁCH\nTài xế bắn: ${referrerId}\nHoa hồng: ${referralFee} VNĐ`;
      }

      text += `\n\nVui lòng vào hệ thống để duyệt.`;

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        text,
      });

      return res
        .status(200)
        .json({ ok: true, message: "Admin notified of ride request", info });
    }

    if (type === "ride_nearby") {
      const {
        driverId,
        driverEmail,
        pickupLat,
        pickupLng,
        distanceKm,
        originalPayload,
      } = payload;
      if (!driverEmail)
        return res
          .status(400)
          .json({ error: "driverEmail required for ride_nearby" });

      const subject = `🚗 Có khách gần bạn (${
        distanceKm ? distanceKm.toFixed(1) : "?"
      }km)`;
      const text = `Có yêu cầu chuyến đi gần vị trí của bạn!\n\nKhoảng cách: ${
        distanceKm ? distanceKm.toFixed(1) : "?"
      } km\nVị trí đón: ${pickupLat}, ${pickupLng}\n\nVui lòng vào app để xem chi tiết và nhận chuyến.`;

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: driverEmail,
        subject,
        text,
      });

      return res
        .status(200)
        .json({ ok: true, message: "Driver notified of nearby ride", info });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error("Error sending email", err);
    return res.status(500).json({ error: String(err) });
  }
}
