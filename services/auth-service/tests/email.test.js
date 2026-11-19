const nodemailer = require('nodemailer');
const emailUtils = require('../src/utils/email');

describe('Auth Service — Email Utility (src/utils/email.js)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validation & Argument Checking', () => {
    test('1. Throws error if recipient email is missing, empty, or not an email', async () => {
      await expect(emailUtils.sendPasswordResetEmail('', 'valid-token'))
        .rejects.toThrow('Invalid recipient email address');

      await expect(emailUtils.sendPasswordResetEmail(null, 'valid-token'))
        .rejects.toThrow('Invalid recipient email address');

      await expect(emailUtils.sendPasswordResetEmail('not-an-email', 'valid-token'))
        .rejects.toThrow('Invalid recipient email address');
    });

    test('2. Throws error if reset token is missing, empty, or not a string', async () => {
      await expect(emailUtils.sendPasswordResetEmail('user@example.com', ''))
        .rejects.toThrow('Invalid reset token');

      await expect(emailUtils.sendPasswordResetEmail('user@example.com', null))
        .rejects.toThrow('Invalid reset token');

      await expect(emailUtils.sendPasswordResetEmail('user@example.com', 12345))
        .rejects.toThrow('Invalid reset token');
    });
  });

  describe('Development Simulation Mode', () => {
    test('3. Simulates sending successfully when EMAIL_SIMULATION is set to true in non-production', async () => {
      process.env.NODE_ENV = 'development';
      process.env.EMAIL_SIMULATION = 'true';
      delete process.env.SMTP_HOST;

      const result = await emailUtils.sendPasswordResetEmail('dev@leadflow.in', 'sample-jwt-token');

      expect(result).toEqual({
        sent: true,
        simulated: true,
      });
    });

    test('4. Does not invoke nodemailer transport when running in simulation mode', async () => {
      process.env.NODE_ENV = 'test';
      process.env.EMAIL_SIMULATION = 'true';

      const createTransportSpy = jest.spyOn(nodemailer, 'createTransport');

      await emailUtils.sendPasswordResetEmail('user@leadflow.in', 'sample-jwt-token');

      expect(createTransportSpy).not.toHaveBeenCalled();
    });
  });

  describe('Production Environment Guardrails', () => {
    test('5. Rejects email simulation in production even if EMAIL_SIMULATION=true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.EMAIL_SIMULATION = 'true';

      await expect(emailUtils.sendPasswordResetEmail('admin@leadflow.in', 'token123'))
        .rejects.toThrow('Email simulation is strictly prohibited in production');
    });

    test('6. Rejects execution in production if SMTP credentials are missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.EMAIL_SIMULATION;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      await expect(emailUtils.sendPasswordResetEmail('admin@leadflow.in', 'token123'))
        .rejects.toThrow('Valid SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is required in production');
    });

    test('7. Throws in non-production if neither SMTP nor EMAIL_SIMULATION is configured', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.EMAIL_SIMULATION;
      delete process.env.SMTP_HOST;

      await expect(emailUtils.sendPasswordResetEmail('admin@leadflow.in', 'token123'))
        .rejects.toThrow('SMTP configuration missing. Configure SMTP or set EMAIL_SIMULATION=true for local development');
    });
  });

  describe('SMTP Transport & Dispatch', () => {
    test('8. Successfully dispatches email via nodemailer when SMTP is configured', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.EMAIL_SIMULATION;
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'smtp_user';
      process.env.SMTP_PASS = 'smtp_password';
      process.env.FROM_EMAIL = 'support@leadflow.in';
      process.env.FRONTEND_URL = 'https://app.leadflow.in/';

      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-12345' });
      jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: mockSendMail,
      });

      const result = await emailUtils.sendPasswordResetEmail('customer@leadflow.in', 'secure.jwt.token');

      expect(result).toEqual({
        sent: true,
        simulated: false,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const mailOptions = mockSendMail.mock.calls[0][0];

      expect(mailOptions.from).toBe('support@leadflow.in');
      expect(mailOptions.to).toBe('customer@leadflow.in');
      expect(mailOptions.subject).toBe('LeadFlow CRM - Password Reset Request');
      expect(mailOptions.text).toContain('https://app.leadflow.in/reset-password?token=secure.jwt.token');
      expect(mailOptions.html).toContain('https://app.leadflow.in/reset-password?token=secure.jwt.token');
    });

    test('9. Propagates SMTP error when nodemailer sendMail fails', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.EMAIL_SIMULATION;
      process.env.SMTP_HOST = 'smtp.example.com';

      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP connection timeout'));
      jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: mockSendMail,
      });

      await expect(
        emailUtils.sendPasswordResetEmail('customer@leadflow.in', 'secure.jwt.token')
      ).rejects.toThrow('SMTP connection timeout');
    });
  });
});
