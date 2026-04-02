import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@yourdomain.com'
const APP_NAME = 'Personal Finance Tracker'

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: 'Reset your password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="background-color:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background-color:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:12px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🔐</span>
              </div>
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 8px;">Reset your password</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#c7d2fe;">1 hour</strong>.
              </p>
              <a href="${resetLink}"
                style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;margin-bottom:32px;">
                Reset Password
              </a>
              <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.<br/>
                The link will expire in 1 hour.
              </p>
              <hr style="border:none;border-top:1px solid #334155;margin:32px 0 24px;" />
              <p style="color:#475569;font-size:12px;margin:0;">
                ${APP_NAME} · If the button doesn't work, copy this link:<br/>
                <span style="color:#6366f1;word-break:break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
