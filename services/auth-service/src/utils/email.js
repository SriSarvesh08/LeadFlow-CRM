const nodemailer = require('nodemailer');

/**
 * Creates and returns a nodemailer transporter instance.
 * Enforces strict SMTP configuration in production and permits simulation only when explicitly configured in non-production.
 *
 * @returns {object|null} Nodemailer transporter instance or null if in simulation mode
 */
const createTransporter = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSimulation = process.env.EMAIL_SIMULATION === 'true';

  if (isProduction) {
    if (isSimulation) {
      throw new Error('Email simulation is strictly prohibited in production');
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('Valid SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is required in production');
    }

    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Non-production environment: explicit simulation mode
  if (isSimulation) {
    return null;
  }

  // Non-production with configured SMTP host
  if (process.env.SMTP_HOST) {
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth,
    });
  }

  // In non-production without SMTP and without explicit simulation flag
  throw new Error('SMTP configuration missing. Configure SMTP or set EMAIL_SIMULATION=true for local development');
};

/**
 * Send a password reset email containing a secure reset link.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} resetToken - JWT password reset token
 * @returns {Promise<{ sent: boolean, simulated: boolean }>}
 */
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    throw new Error('Invalid recipient email address');
  }

  if (!resetToken || typeof resetToken !== 'string' || resetToken.trim() === '') {
    throw new Error('Invalid reset token');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isSimulation = process.env.EMAIL_SIMULATION === 'true';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@leadflow.in';

  if (!isProduction && isSimulation) {
    return {
      sent: true,
      simulated: true,
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email transporter could not be initialized');
  }

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'LeadFlow CRM - Password Reset Request',
    text: `You requested a password reset for your LeadFlow CRM account.\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your LeadFlow CRM account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  return {
    sent: true,
    simulated: false,
  };
};

module.exports = {
  createTransporter,
  sendPasswordResetEmail,
};
