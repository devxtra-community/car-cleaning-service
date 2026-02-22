import { transporter } from './mailer';

interface WelcomeMailOptions {
  type: 'welcome';
  to: string;
  full_name: string;
  password: string;
  role: string;
}

interface PasswordResetMailOptions {
  type: 'password_reset';
  to: string;
  full_name: string;
  otp: string;
  expiryMinutes: number;
}

type MailOptions = WelcomeMailOptions | PasswordResetMailOptions;

const FROM = `"Team" <${process.env.MAIL_FROM ?? process.env.MAIL_USER}>`;

const wrapper = (content: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
  ${content}
  <hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;" />
  <p style="color:#555;">Thank you and have a nice day! 😊</p>
  <p style="font-weight:bold;color:#2d7a4f;">— The Team</p>
</div>`;

const buildWelcomeHtml = (opts: WelcomeMailOptions): string => {
  const { to, full_name, password, role } = opts;
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');

  return wrapper(`
    <h2 style="color:#2d7a4f;">Congratulations, ${full_name}! 🎉</h2>
    <p>Your account has been created successfully. You can now log in using the credentials below:</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;width:40%;">Username / Email</td>
        <td style="padding:8px;border:1px solid #ddd;">${to}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;">Password</td>
        <td style="padding:8px;border:1px solid #ddd;">${password}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;">Role</td>
        <td style="padding:8px;border:1px solid #ddd;">${formattedRole}</td>
      </tr>
    </table>

    <p>Please start your work as per the offer letter. We are excited to have you on board!</p>
    <p style="color:#888;font-size:13px;">For security reasons, we recommend changing your password after your first login.</p>
  `);
};

const buildPasswordResetHtml = (opts: PasswordResetMailOptions): string => {
  const { full_name, otp, expiryMinutes } = opts;
  const firstName = full_name.split(' ')[0];

  const digits = otp
    .split('')
    .map(
      (d) =>
        `<span style="display:inline-block;width:44px;height:52px;line-height:52px;text-align:center;` +
        `font-size:28px;font-weight:800;background:#f5f5f5;border:1px solid #ddd;border-radius:8px;` +
        `color:#111;margin:0 4px;">${d}</span>`
    )
    .join('');

  return wrapper(`
    <h2 style="color:#2d7a4f;">Password Reset Request 🔐</h2>
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>We received a request to reset your password. Use the code below — it expires in <strong>${expiryMinutes} minutes</strong>.</p>

    <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#888;text-transform:uppercase;">Your reset code</p>
      <div>${digits}</div>
      <p style="margin:12px 0 0;font-size:12px;color:#888;">⏱ Valid for ${expiryMinutes} minutes</p>
    </div>

    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#7a5f00;">
        ⚠️ If you didn't request this, you can safely ignore this email. Your password will not change.
      </p>
    </div>

    <p style="color:#888;font-size:13px;">For security, this code can only be used once. After resetting, all active sessions will be signed out.</p>
  `);
};

export const sendMail = async (options: MailOptions): Promise<void> => {
  if (options.type === 'welcome') {
    await transporter.sendMail({
      from: FROM,
      to: options.to,
      subject: '🎉 Your Account Has Been Created Successfully',
      html: buildWelcomeHtml(options),
    });
  } else {
    await transporter.sendMail({
      from: FROM,
      to: options.to,
      subject: `${options.otp} is your password reset code`,
      text: `Hi ${options.full_name},\n\nYour reset code is: ${options.otp}\n\nExpires in ${options.expiryMinutes} minutes.\n\nIf you didn't request this, ignore this email.`,
      html: buildPasswordResetHtml(options),
    });
  }
};

export const sendWelcomeMail = (opts: Omit<WelcomeMailOptions, 'type'>): Promise<void> =>
  sendMail({ type: 'welcome', ...opts });
