// Appointment Reminder Job Processor - Randevu Hatırlatma Job'ları
import { appointmentReminderQueue } from '../config/queues.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { queueAppointmentReminder } from './emailProcessor.js';

/**
 * Job types
 */
const ReminderJobTypes = {
  DAILY_REMINDER_CHECK: 'daily_reminder_check',
  SINGLE_REMINDER: 'single_reminder',
  HOURS_24_REMINDER: '24_hours_reminder',
};

/**
 * Randevu hatırlatma job processor - Ana işleyici
 */
async function processReminderJob(job) {
  const { type, data } = job.data;

  logger.info('Processing reminder job', { jobId: job.id, type });

  try {
    let result;

    switch (type) {
      case ReminderJobTypes.DAILY_REMINDER_CHECK:
        result = await processDailyReminderCheck(data);
        break;

      case ReminderJobTypes.SINGLE_REMINDER:
        result = await processSingleReminder(data);
        break;

      case ReminderJobTypes.HOURS_24_REMINDER:
        result = await process24HoursReminder(data);
        break;

      default:
        throw new Error(`Bilinmeyen reminder job type: ${type}`);
    }

    logger.info('Reminder job completed successfully', { jobId: job.id, type });

    return result;
  } catch (error) {
    logger.error('Reminder job failed', { jobId: job.id, type, error: error.message });
    throw error;
  }
}

/**
 * Günlük randevu hatırlatma kontrolü
 * Her gece yarısı çalışır, bir sonraki günün randevularını kontrol eder
 */
async function processDailyReminderCheck(data) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  logger.info('Checking appointments for tomorrow', { date: tomorrow.toISOString() });

  // Bir sonraki günün randevularını getir
  const appointments = await prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: tomorrow,
        lte: endOfTomorrow,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      hospital: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
    },
  });

  logger.info(`Found ${appointments.length} appointments for tomorrow`);

  const results = {
    processed: 0,
    patientRemindersQueued: 0,
    doctorRemindersQueued: 0,
    failed: 0,
    errors: [],
  };

  // Her randevu için hatırlatma email'i kuyruğa ekle
  for (const appointment of appointments) {
    try {
      const appointmentTime = `${appointment.appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      const appointmentDateStr = appointment.appointmentDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Hasta için hatırlatma email'i
      if (appointment.user?.email) {
        await queueAppointmentReminder(
          appointment.user.email,
          `${appointment.user.firstName} ${appointment.user.lastName}`,
          {
            doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            hospitalName: appointment.hospital.name,
            date: appointmentDateStr,
            time: appointmentTime,
          }
        );
        results.patientRemindersQueued++;
      }

      // Doktor için hatırlatma email'i
      if (appointment.doctor?.email) {
        await queueAppointmentReminder(
          appointment.doctor.email,
          `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          {
            doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            hospitalName: appointment.hospital.name,
            date: appointmentDateStr,
            time: appointmentTime,
            patientName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          }
        );
        results.doctorRemindersQueued++;
      }

      // Randevu durumunu güncelle
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSent: true },
      });

      results.processed++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        appointmentId: appointment.id,
        error: error.message,
      });
      logger.error('Error processing reminder for appointment', {
        appointmentId: appointment.id,
        error: error.message,
      });
    }
  }

  logger.info('Daily reminder check completed', results);

  return results;
}

/**
 * Tek bir randevu için hatırlatma
 */
async function processSingleReminder(data) {
  const { appointmentId } = data;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      hospital: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  const appointmentTime = `${appointment.appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  const appointmentDateStr = appointment.appointmentDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const results = {
    patientReminderQueued: false,
    doctorReminderQueued: false,
  };

  // Hasta için hatırlatma email'i
  if (appointment.user?.email) {
    await queueAppointmentReminder(
      appointment.user.email,
      `${appointment.user.firstName} ${appointment.user.lastName}`,
      {
        doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        hospitalName: appointment.hospital.name,
        date: appointmentDateStr,
        time: appointmentTime,
      }
    );
    results.patientReminderQueued = true;
  }

  // Doktor için hatırlatma email'i
  if (appointment.doctor?.email) {
    await queueAppointmentReminder(
      appointment.doctor.email,
      `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      {
        doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        hospitalName: appointment.hospital.name,
        date: appointmentDateStr,
        time: appointmentTime,
        patientName: `${appointment.user.firstName} ${appointment.user.lastName}`,
      }
    );
    results.doctorReminderQueued = true;
  }

  // Randevu durumunu güncelle
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { reminderSent: true },
  });

  return results;
}

/**
 * 24 saat öncesi hatırlatma
 */
async function process24HoursReminder(data) {
  const { appointmentId } = data;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      hospital: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  const appointmentTime = `${appointment.appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  const appointmentDateStr = appointment.appointmentDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const results = {
    patientReminderQueued: false,
    doctorReminderQueued: false,
  };

  // Hasta için 24 saat öncesi hatırlatma email'i
  if (appointment.user?.email) {
    await queueAppointmentReminder(
      appointment.user.email,
      `${appointment.user.firstName} ${appointment.user.lastName}`,
      {
        doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        hospitalName: appointment.hospital.name,
        date: appointmentDateStr,
        time: appointmentTime,
        is24HourReminder: true,
      }
    );
    results.patientReminderQueued = true;
  }

  // Randevu durumunu güncelle
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { reminder24hSent: true },
  });

  return results;
}

/**
 * Randevu hatırlatma job'ini kuyruğa ekle (yardımcı fonksiyonlar)
 */

/**
 * Günlük hatırlatma kontrolü kuyruğa ekle
 * Her gece yarısı çalışacak şekilde schedule et
 */
export async function queueDailyReminderCheck() {
  // Gece yarısı (00:00) için cron pattern
  const job = await appointmentReminderQueue.add(
    {
      type: ReminderJobTypes.DAILY_REMINDER_CHECK,
      data: {},
    },
    {
      repeat: {
        cron: '0 0 * * *', // Her gece yarısı
        tz: 'Europe/Istanbul',
      },
    }
  );

  logger.info('Daily reminder check scheduled', { jobId: job.id });
  return job;
}

/**
 * Tek bir randevu için hatırlatma kuyruğa ekle
 */
export async function queueSingleReminder(appointmentId) {
  const job = await appointmentReminderQueue.add({
    type: ReminderJobTypes.SINGLE_REMINDER,
    data: { appointmentId },
  });

  logger.info('Single reminder queued', { jobId: job.id, appointmentId });
  return job;
}

/**
 * 24 saat öncesi hatırlatma kuyruğa ekle
 */
export async function queue24HoursReminder(appointmentId, delayMs) {
  const job = await appointmentReminderQueue.add(
    {
      type: ReminderJobTypes.HOURS_24_REMINDER,
      data: { appointmentId },
    },
    {
      delay: delayMs,
    }
  );

  logger.info('24 hours reminder queued', {
    jobId: job.id,
    appointmentId,
    scheduledFor: new Date(Date.now() + delayMs),
  });
  return job;
}

/**
 * Appointment reminder queue processor'ı başlat
 */
export function startAppointmentReminderProcessor() {
  appointmentReminderQueue.process(3, async (job) => {
    return await processReminderJob(job);
  });

  logger.info('Appointment reminder processor started (concurrency: 3)');

  // Error handling
  appointmentReminderQueue.on('failed', (job, err) => {
    logger.error('Reminder job permanently failed', {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  appointmentReminderQueue.on('completed', (job, result) => {
    logger.info('Reminder job completed', {
      jobId: job.id,
      type: job.data.type,
    });
  });
}

/**
 * Randevu oluşturulduğunda otomatik hatırlatma job'ları oluştur
 * Bu fonksiyonu appointment controller'da çağırabilirsiniz
 */
export async function scheduleAppointmentReminders(appointment) {
  const results = {
    dailyCheck: null,
    hours24: null,
  };

  // 24 saat öncesi hatırlatma
  const appointmentTime = new Date(appointment.appointmentDate);
  const now = new Date();
  const msUntil24HoursBefore = appointmentTime.getTime() - now.getTime() - 24 * 60 * 60 * 1000;

  if (msUntil24HoursBefore > 0) {
    try {
      results.hours24 = await queue24HoursReminder(appointment.id, msUntil24HoursBefore);
    } catch (error) {
      logger.error('Error scheduling 24h reminder', {
        appointmentId: appointment.id,
        error: error.message,
      });
    }
  }

  return results;
}

export default {
  ReminderJobTypes,
  processReminderJob,
  queueDailyReminderCheck,
  queueSingleReminder,
  queue24HoursReminder,
  scheduleAppointmentReminders,
  startAppointmentReminderProcessor,
};
