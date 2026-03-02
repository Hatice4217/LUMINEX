// Email Service - Resend
import { Resend } from 'resend';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const resend = process.env.EMAIL_ENABLED === 'true'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@luminex.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

/**
 * Email gönderme fonksiyonu
 */
async function sendEmail({ to, subject, template, data }) {
  if (!resend) {
    logger.warn('Email service is disabled, skipping email send');
    return { success: false, message: 'Email service disabled' };
  }

  try {
    // Email log oluştur
    const emailLog = await prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        metadata: JSON.stringify(data),
        status: 'PENDING',
      },
    });

    // HTML content'i template'e göre oluştur
    const html = getEmailTemplate(template, data);

    // Email gönder
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    // Email log'u güncelle
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        deliveredAt: new Date(),
      },
    });

    logger.info('Email sent successfully', { emailId: emailLog.id, to, template });

    return { success: true, emailId: emailLog.id, result };
  } catch (error) {
    logger.error('Error sending email:', error);

    // Email log'u FAILED olarak güncelle
    try {
      const emailLog = await prisma.emailLog.findFirst({
        where: { to, template, status: 'PENDING' },
        orderBy: { sentAt: 'desc' },
      });

      if (emailLog) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'FAILED' },
        });
      }
    } catch (updateError) {
      logger.error('Error updating email log:', updateError);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Email template'ler
 */
function getEmailTemplate(template, data) {
  const templates = {
    passwordReset: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LUMINEX</h1>
            <p>Sağlık Yönetim Sistemi</p>
          </div>
          <div class="content">
            <h2>Şifre Sıfırlama Talebi</h2>
            <p>Merhaba ${data.name},</p>
            <p>Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz:</p>
            <center>
              <a href="${data.resetLink}" class="button">Şifremi Sıfırla</a>
            </center>
            <p>Bu link 1 saat geçerlidir.</p>
            <p>Eğer bu talebi siz oluşturmadıysanız, bu emaili dikkate almayınız.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LUMINEX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    emailVerification: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LUMINEX</h1>
            <p>Sağlık Yönetim Sistemi</p>
          </div>
          <div class="content">
            <h2>Email Doğrulama</h2>
            <p>Merhaba ${data.name},</p>
            <p>Email adresinizi doğrulamak için lütfen aşağıdaki butona tıklayın:</p>
            <center>
              <a href="${data.verificationLink}" class="button">Email Doğrula</a>
            </center>
            <p>Bu link 24 saat geçerlidir.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LUMINEX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    appointmentConfirmation: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LUMINEX</h1>
            <p>Sağlık Yönetim Sistemi</p>
          </div>
          <div class="content">
            <h2>Randevu Onayı</h2>
            <p>Merhaba ${data.name},</p>
            <p>Randevunuz başarıyla oluşturuldu. Randevu detayları aşağıdadır:</p>
            <div class="details">
              <p><strong>Doktor:</strong> ${data.doctorName}</p>
              <p><strong>Hastane:</strong> ${data.hospitalName}</p>
              <p><strong>Tarih:</strong> ${data.date}</p>
              <p><strong>Saat:</strong> ${data.time}</p>
            </div>
            <p>Randevunuza zamanında gelmeniz önemle rica olunur.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LUMINEX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    appointmentReminder: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LUMINEX</h1>
            <p>Sağlık Yönetim Sistemi</p>
          </div>
          <div class="content">
            <h2>Randevu Hatırlatma</h2>
            <p>Merhaba ${data.name},</p>
            <p>Yarınki randevunuz için hatırlatma:</p>
            <div class="details">
              <p><strong>Doktor:</strong> ${data.doctorName}</p>
              <p><strong>Hastane:</strong> ${data.hospitalName}</p>
              <p><strong>Tarih:</strong> ${data.date}</p>
              <p><strong>Saat:</strong> ${data.time}</p>
            </div>
            <p>Lütfen randevunuza 15 dakika öncesinden geliniz.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LUMINEX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return templates[template] || `<p>${data.message || 'Email content'}</p>`;
}

/**
 * Şifre sıfırlama email'i gönder
 */
async function sendPasswordReset(email, name, resetLink) {
  return await sendEmail({
    to: email,
    subject: 'Şifre Sıfırlama - LUMINEX',
    template: 'passwordReset',
    data: { name, resetLink },
  });
}

/**
 * Email doğrulama gönder
 */
async function sendEmailVerification(email, name, verificationLink) {
  return await sendEmail({
    to: email,
    subject: 'Email Doğrulama - LUMINEX',
    template: 'emailVerification',
    data: { name, verificationLink },
  });
}

/**
 * Randevu onay email'i gönder
 */
async function sendAppointmentConfirmation(email, name, details) {
  return await sendEmail({
    to: email,
    subject: 'Randevu Onayı - LUMINEX',
    template: 'appointmentConfirmation',
    data: { name, ...details },
  });
}

/**
 * Randevu hatırlatma email'i gönder
 */
async function sendAppointmentReminder(email, name, details) {
  return await sendEmail({
    to: email,
    subject: 'Randevu Hatırlatma - LUMINEX',
    template: 'appointmentReminder',
    data: { name, ...details },
  });
}

/**
 * Email loglarını getir
 */
async function getEmailLogs(filters = {}) {
  const { userId, status, template, page = 1, limit = 20 } = filters;

  const where = {};

  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (template) where.template = template;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.emailLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Email istatistikleri
 */
async function getEmailStats() {
  const [total, sent, delivered, failed, pending] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: 'SENT' } }),
    prisma.emailLog.count({ where: { status: 'DELIVERED' } }),
    prisma.emailLog.count({ where: { status: 'FAILED' } }),
    prisma.emailLog.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    total,
    sent,
    delivered,
    failed,
    pending,
    successRate: total > 0 ? Math.round(((sent + delivered) / total) * 100) : 0,
  };
}

/**
 * Queue ile email gönder (wrapper fonksiyon)
 * Bu fonksiyonu controller'larda kullanabilirsiniz
 */
async function sendEmailQueue({ to, subject, template, data }) {
  // Email processor'ı dinamik import et
  const { queueAppointmentConfirmation, queueAppointmentReminder, queueEmailVerification, queuePasswordReset } = await import('../queues/emailProcessor.js');

  // Template tipine göre doğru queue fonksiyonunu çağır
  switch (template) {
    case 'appointmentConfirmation':
      return await queueAppointmentConfirmation(to, data.name || data.firstName, {
        doctorName: data.doctorName,
        hospitalName: data.hospitalName,
        date: data.date,
        time: data.time,
      });

    case 'appointmentReminder':
      return await queueAppointmentReminder(to, data.name || data.firstName, {
        doctorName: data.doctorName,
        hospitalName: data.hospitalName,
        date: data.date,
        time: data.time,
      });

    case 'emailVerification':
      return await queueEmailVerification(to, data.name, data.verificationLink);

    case 'passwordReset':
      return await queuePasswordReset(to, data.name, data.resetLink);

    default:
      // Generic email için doğrudan sendEmail kullan (senkron)
      return await sendEmail({ to, subject, template, data });
  }
}

export default {
  sendEmail,
  sendPasswordReset,
  sendEmailVerification,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  getEmailLogs,
  getEmailStats,
  sendEmailQueue,
};
