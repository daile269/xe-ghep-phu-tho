Firebase Cloud Functions: ride email notifications (Nodemailer / Gmail)

Purpose
- Send email notifications for ride events:
  - `sendRideCreatedEmail`: notify admin when a ride node is created
  - `sendRideApprovedEmail`: notify driver when admin approves a ride

Requirements
- Firebase project and CLI installed and configured (`firebase login` + `firebase init functions` if not already set up).
- Nodemailer is used with Gmail SMTP. You should create a Gmail App Password (requires 2-Step Verification) for the sender account.

Setup & Deploy
1. Install dependencies
   ```powershell
   cd functions
   npm install
   ```

2. Configure environment variables for functions (use Firebase functions config)
   ```powershell
   # replace with your values
   firebase functions:config:set smtp.user="your.email@gmail.com" smtp.pass="APP_PASSWORD_HERE" smtp.from="your.email@gmail.com" admin.email="admin@yourdomain.com"
   ```

   - `smtp.user`: Gmail address used to send emails
   - `smtp.pass`: App Password (16 char) generated in Google Account -> Security -> App passwords
   - `smtp.from`: From address shown in outgoing emails
   - `admin.email`: email address to receive admin notifications

3. (Required) Ensure the Firebase project is on Blaze (Pay-as-you-go) so functions can make outbound network calls.

4. Deploy the functions
   ```powershell
   firebase deploy --only functions
   # or deploy specific functions
   firebase deploy --only functions:sendRideCreatedEmail,functions:sendRideApprovedEmail
   ```

Testing
- Create a ride in Realtime Database (Console) or from the app to trigger `sendRideCreatedEmail`.
- Approve a PENDING ride (admin UI) to trigger `sendRideApprovedEmail` to the driver's email (driver must have `isDriver: true`, `driverStatus: 'APPROVED'` and an `email` field).

Notes
- The function will skip sending if SMTP credentials or admin/driver emails are not configured.
- App passwords should be treated as secrets and not committed to source control. Use `firebase functions:config:set` to keep them out of repo.
- Gmail has sending limits (suitable for notifications but not large-scale transactional volume). For higher volume or better deliverability, use a dedicated provider (SendGrid, Mailgun, etc.).

If you want, I can also add optional fallback logic (try SendGrid first, then SMTP) or add templates for HTML emails.
