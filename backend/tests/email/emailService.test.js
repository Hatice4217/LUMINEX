// Email Service Tests
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Email Service Tests', () => {
  let emailService;
  let mockPrisma;
  let mockResend;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      emailLog: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    // Mock Resend
    mockResend = {
      emails: {
        send: jest.fn(),
      },
    };

    // Import email service
    emailService = (await import('../../src/services/emailService.js')).default;
  });

  describe('Send Email', () => {
    it('should send email successfully', async () => {
      const mockEmailLog = {
        id: 'log-1',
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'testTemplate',
        status: 'PENDING',
        sentAt: new Date(),
      };

      mockPrisma.emailLog.create.mockResolvedValue(mockEmailLog);
      mockResend.emails.send.mockResolvedValue({ id: 'email-1' });

      // Mock email service to use our mocks
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'testTemplate',
        data: { name: 'Test User' },
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('log-1');
    });

    it('should handle email sending errors', async () => {
      mockPrisma.emailLog.create.mockResolvedValue({
        id: 'log-1',
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'testTemplate',
        status: 'PENDING',
        sentAt: new Date(),
      });

      mockResend.emails.send.mockRejectedValue(new Error('SMTP Error'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'testTemplate',
        data: { name: 'Test User' },
      });

      expect(result.success).toBe(false);
    });

    it('should skip sending when email service is disabled', async () => {
      process.env.EMAIL_ENABLED = 'false';

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'testTemplate',
        data: { name: 'Test User' },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('disabled');

      process.env.EMAIL_ENABLED = 'true';
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      mockPrisma.emailLog.create.mockResolvedValue({
        id: 'log-1',
        to: 'user@example.com',
        subject: 'Şifre Sıfırlama - LUMINEX',
        template: 'passwordReset',
        status: 'PENDING',
        sentAt: new Date(),
      });

      mockResend.emails.send.mockResolvedValue({ id: 'email-1' });

      const result = await emailService.sendPasswordReset(
        'user@example.com',
        'Test User',
        'http://localhost:8080/reset-password?token=abc123'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Email Verification', () => {
    it('should send email verification', async () => {
      mockPrisma.emailLog.create.mockResolvedValue({
        id: 'log-1',
        to: 'user@example.com',
        subject: 'Email Doğrulama - LUMINEX',
        template: 'emailVerification',
        status: 'PENDING',
        sentAt: new Date(),
      });

      mockResend.emails.send.mockResolvedValue({ id: 'email-1' });

      const result = await emailService.sendEmailVerification(
        'user@example.com',
        'Test User',
        'http://localhost:8080/verify-email?token=xyz789'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Appointment Confirmation Email', () => {
    it('should send appointment confirmation', async () => {
      mockPrisma.emailLog.create.mockResolvedValue({
        id: 'log-1',
        to: 'patient@example.com',
        subject: 'Randevu Onayı - LUMINEX',
        template: 'appointmentConfirmation',
        status: 'PENDING',
        sentAt: new Date(),
      });

      mockResend.emails.send.mockResolvedValue({ id: 'email-1' });

      const result = await emailService.sendAppointmentConfirmation(
        'patient@example.com',
        'Test Patient',
        {
          doctorName: 'Dr. Smith',
          hospitalName: 'Test Hospital',
          date: '15.06.2025',
          time: '10:30',
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Appointment Reminder Email', () => {
    it('should send appointment reminder', async () => {
      mockPrisma.emailLog.create.mockResolvedValue({
        id: 'log-1',
        to: 'patient@example.com',
        subject: 'Randevu Hatırlatma - LUMINEX',
        template: 'appointmentReminder',
        status: 'PENDING',
        sentAt: new Date(),
      });

      mockResend.emails.send.mockResolvedValue({ id: 'email-1' });

      const result = await emailService.sendAppointmentReminder(
        'patient@example.com',
        'Test Patient',
        {
          doctorName: 'Dr. Smith',
          hospitalName: 'Test Hospital',
          date: '15.06.2025',
          time: '10:30',
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Email Logs', () => {
    it('should retrieve email logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          to: 'user1@example.com',
          subject: 'Test 1',
          template: 'testTemplate',
          status: 'SENT',
          sentAt: new Date(),
          user: { firstName: 'User', lastName: 'One' },
        },
        {
          id: 'log-2',
          to: 'user2@example.com',
          subject: 'Test 2',
          template: 'testTemplate',
          status: 'DELIVERED',
          sentAt: new Date(),
          user: { firstName: 'User', lastName: 'Two' },
        },
      ];

      mockPrisma.emailLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.emailLog.count.mockResolvedValue(2);

      const result = await emailService.getEmailLogs({});

      expect(result.logs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter email logs by status', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          to: 'user@example.com',
          subject: 'Test',
          template: 'testTemplate',
          status: 'FAILED',
          sentAt: new Date(),
        },
      ];

      mockPrisma.emailLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.emailLog.count.mockResolvedValue(1);

      const result = await emailService.getEmailLogs({ status: 'FAILED' });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].status).toBe('FAILED');
    });
  });

  describe('Email Statistics', () => {
    it('should retrieve email statistics', async () => {
      mockPrisma.emailLog.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50) // sent
        .mockResolvedValueOnce(30) // delivered
        .mockResolvedValueOnce(10) // failed
        .mockResolvedValueOnce(10); // pending

      const stats = await emailService.getEmailStats();

      expect(stats.total).toBe(100);
      expect(stats.sent).toBe(50);
      expect(stats.delivered).toBe(30);
      expect(stats.failed).toBe(10);
      expect(stats.pending).toBe(10);
      expect(stats.successRate).toBe(80); // (50 + 30) / 100
    });

    it('should handle zero emails gracefully', async () => {
      mockPrisma.emailLog.count.mockResolvedValue(0);

      const stats = await emailService.getEmailStats();

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });
});
