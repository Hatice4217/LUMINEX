// Email Job Processor - Background Email Sending
import { emailQueue } from '../config/queues.js';
import emailService from '../services/emailService.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Email job processor - Job'ları işleyen fonksiyonlar
 */

/**
 * Job types
 */
const EmailJobTypes = {
  SEND_EMAIL: 'send_email',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  BULK_EMAIL: 'bulk_email',
};

/**
 * Email job processor - Ana işleyici
 */
async function processEmailJob(job) {
  const { type, data } = job.data;

  logger.info('Processing email job', { jobId: job.id, type });

  try {
    let result;

    switch (type) {
      case EmailJobTypes.SEND_EMAIL:
        result = await processSendEmail(data);
        break;

      case EmailJobTypes.PASSWORD_RESET:
        result = await processPasswordReset(data);
        break;

      case EmailJobTypes.EMAIL_VERIFICATION:
        result = await processEmailVerification(data);
        break;

      case EmailJobTypes.APPOINTMENT_CONFIRMATION:
        result = await processAppointmentConfirmation(data);
        break;

      case EmailJobTypes.APPOINTMENT_REMINDER:
        result = await processAppointmentReminder(data);
        break;

      case EmailJobTypes.BULK_EMAIL:
        result = await processBulkEmail(data);
        break;

      default:
        throw new Error(`Bilinmeyen email job type: ${type}`);
    }

    // Job durumunu güncelle
    if (result.emailLogId) {
      await prisma.emailLog.update({
        where: { id: result.emailLogId },
        data: {
          status: 'SENT',
          deliveredAt: new Date(),
        },
      });
    }

    logger.info('Email job completed successfully', { jobId: job.id, type });

    return result;
  } catch (error) {
    logger.error('Email job failed', { jobId: job.id, type, error: error.message });

    // Job durumunu FAILED olarak güncelle
    if (job.data.emailLogId) {
      try {
        await prisma.emailLog.update({
          where: { id: job.data.emailLogId },
          data: { status: 'FAILED' },
        });
      } catch (updateError) {
        logger.error('Failed to update email log status:', updateError);
      }
    }

    throw error; // Bull'un retry mekanizması için hata fırlat
  }
}

/**
 * Basit email gönderme
 */
async function processSendEmail(data) {
  const { to, subject, template, emailData } = data;

  const result = await emailService.sendEmail({
    to,
    subject,
    template,
    data: emailData,
  });

  return result;
}

/**
 * Şifre sıfırlama email'i
 */
async function processPasswordReset(data) {
  const { email, name, resetLink } = data;

  return await emailService.sendPasswordReset(email, name, resetLink);
}

/**
 * Email doğrulama
 */
async function processEmailVerification(data) {
  const { email, name, verificationLink } = data;

  return await emailService.sendEmailVerification(email, name, verificationLink);
}

/**
 * Randevu onay email'i
 */
async function processAppointmentConfirmation(data) {
  const { email, name, doctorName, hospitalName, date, time } = data;

  return await emailService.sendAppointmentConfirmation(email, name, {
    doctorName,
    hospitalName,
    date,
    time,
  });
}

/**
 * Randevu hatırlatma email'i
 */
async function processAppointmentReminder(data) {
  const { email, name, doctorName, hospitalName, date, time } = data;

  return await emailService.sendAppointmentReminder(email, name, {
    doctorName,
    hospitalName,
    date,
    time,
  });
}

/**
 * Toplu email gönderme
 */
async function processBulkEmail(data) {
  const { recipients, subject, template, emailData } = data;
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    try {
      await emailService.sendEmail({
        to: recipient.email,
        subject,
        template,
        data: {
          ...emailData,
          name: recipient.name || recipient.firstName || 'Kullanıcı',
        },
      });

      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Email job'ini kuyruğa ekle (yardımcı fonksiyonlar)
 */

/**
 * Şifre sıfırlama email'i kuyruğa ekle
 */
export async function queuePasswordReset(email, name, resetLink) {
  const job = await emailQueue.add({
    type: EmailJobTypes.PASSWORD_RESET,
    data: { email, name, resetLink },
  });

  logger.info('Password reset email queued', { jobId: job.id });
  return job;
}

/**
 * Email doğrulama kuyruğa ekle
 */
export async function queueEmailVerification(email, name, verificationLink) {
  const job = await emailQueue.add({
    type: EmailJobTypes.EMAIL_VERIFICATION,
    data: { email, name, verificationLink },
  });

  logger.info('Email verification queued', { jobId: job.id });
  return job;
}

/**
 * Randevu onay email'i kuyruğa ekle
 */
export async function queueAppointmentConfirmation(email, name, details) {
  const job = await emailQueue.add({
    type: EmailJobTypes.APPOINTMENT_CONFIRMATION,
    data: { email, name, ...details },
  });

  logger.info('Appointment confirmation email queued', { jobId: job.id });
  return job;
}

/**
 * Randevu hatırlatma email'i kuyruğa ekle (gelecek tarih için)
 */
export async function queueAppointmentReminder(email, name, details, delay = 0) {
  const job = await emailQueue.add({
    type: EmailJobTypes.APPOINTMENT_REMINDER,
    data: { email, name, ...details },
  }, {
    delay: delay, // Milisaniye cinsinden gecikme
  });

  logger.info('Appointment reminder queued', { jobId: job.id, scheduledFor: new Date(Date.now() + delay) });
  return job;
}

/**
 * Toplu email kuyruğa ekle
 */
export async function queueBulkEmail(recipients, subject, template, emailData) {
  const job = await emailQueue.add({
    type: EmailJobTypes.BULK_EMAIL,
    data: { recipients, subject, template, emailData },
  });

  logger.info('Bulk email queued', { jobId: job.id, recipientCount: recipients.length });
  return job;
}

/**
 * Email queue processor'ı başlat
 */
export function startEmailProcessor() {
  emailQueue.process(5, async (job) => {
    return await processEmailJob(job);
  });

  logger.info('Email processor started (concurrency: 5)');

  // Error handling
  emailQueue.on('failed', (job, err) => {
    logger.error('Email job permanently failed', {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  emailQueue.on('completed', (job, result) => {
    logger.info('Email job completed', {
      jobId: job.id,
      type: job.data.type,
    });
  });
}

export default {
  EmailJobTypes,
  processEmailJob,
  queuePasswordReset,
  queueEmailVerification,
  queueAppointmentConfirmation,
  queueAppointmentReminder,
  queueBulkEmail,
  startEmailProcessor,
};
