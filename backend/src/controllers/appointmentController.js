// Appointment Controller
import crypto from 'crypto';
import prisma from '../config/database.js';
import { validateAppointmentDate } from '../utils/validation-utils.js';
import logger from '../utils/logger.js';
import { invalidateAppointmentCache } from '../middlewares/cache-middleware.js';
import emailService from '../services/emailService.js';
import { sendNotificationToUser, sendAppointmentUpdate } from '../config/socket.js';
import { encryptField, decryptField } from '../services/encryptionService.js';
import { scheduleAppointmentReminders } from '../queues/appointmentReminderProcessor.js';

/**
 * Randevu oluştur
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { hospitalId, doctorId, departmentId, appointmentDate, notes, symptoms } = req.body;
    const patientId = req.user.id;

    // Tarih validasyonu
    if (!validateAppointmentDate(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz randevu tarihi',
      });
    }

    // Doktor kontrolü
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: 'DOCTOR',
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doktor bulunamadı',
      });
    }

    // Hastane kontrolü
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hastane bulunamadı',
      });
    }

    // Randevu oluştur
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        hospitalId,
        departmentId,
        appointmentDate: new Date(appointmentDate),
        notes,
        symptoms,
        status: 'PENDING',
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    // Doktora bildirim gönder
    await prisma.notification.create({
      data: {
        userId: doctorId,
        type: 'appointment',
        message: `Yeni randevu talebi: ${req.user.firstName} ${req.user.lastName}`,
      },
    });

    // Doktora real-time bildirim gönder
    sendNotificationToUser(doctorId, {
      id: crypto.randomUUID(),
      type: 'appointment',
      message: `Yeni randevu talebi: ${req.user.firstName} ${req.user.lastName}`,
      data: {
        appointmentId: appointment.id,
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        appointmentDate: appointment.appointmentDate,
      },
    });

    // Randevu odasına güncelleme gönder
    sendAppointmentUpdate(appointment.id, {
      type: 'created',
      appointment,
    });

    // Hasta için email gönder (email varsa)
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (patient && patient.email) {
      try {
        await emailService.sendAppointmentConfirmation(
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          {
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            hospitalName: hospital.name,
            date: new Date(appointmentDate).toLocaleDateString('tr-TR'),
            time: new Date(appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          }
        );
      } catch (emailError) {
        logger.error('Failed to send appointment confirmation email:', emailError);
      }
    }

    logger.info('Appointment created', { appointmentId: appointment.id, patientId });

    // Randevu hatırlatma job'larını schedule et
    try {
      await scheduleAppointmentReminders(appointment);
      logger.info('Appointment reminders scheduled', { appointmentId: appointment.id });
    } catch (reminderError) {
      logger.error('Failed to schedule appointment reminders:', reminderError);
      // Randevu oluşturma başarılı olsun diye hata fırlatmıyoruz
    }

    // Cache'i invalidate et (hem hasta hem doktor için)
    await invalidateAppointmentCache(patientId);
    await invalidateAppointmentCache(doctorId);

    res.status(201).json({
      success: true,
      message: 'Randevu talebi oluşturuldu',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcının randevularını listele
 */
export const getAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, startDate, endDate } = req.query;

    // Filtreleme koşulları
    const where = {};

    if (userRole === 'PATIENT') {
      where.patientId = userId;
    } else if (userRole === 'DOCTOR') {
      where.doctorId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = new Date(startDate);
      if (endDate) where.appointmentDate.lte = new Date(endDate);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: { appointments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Randevu detayı getir
 */
export const getAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    // Yetki kontrolü
    if (userRole === 'PATIENT' && appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu randevuya erişim yetkiniz yok',
      });
    }

    if (userRole === 'DOCTOR' && appointment.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu randevuya erişim yetkiniz yok',
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Randevu güncelle
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, diagnosis, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    // Yetki kontrolü
    if (userRole === 'PATIENT' && appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu randevuyu güncelleme yetkiniz yok',
      });
    }

    // Sadece doktor teşhis koyabilir
    if (diagnosis && userRole !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Teşiş koyabilmek için doktor olmalısınız',
      });
    }

    // Güncelleme verisi hazırla
    const updateData = {};
    if (status) updateData.status = status;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    // Bildirim gönder
    if (status && status !== appointment.status) {
      await prisma.notification.create({
        data: {
          userId: userRole === 'DOCTOR' ? appointment.patientId : appointment.doctorId,
          type: 'appointment',
          message: `Randevu durumu güncellendi: ${status}`,
        },
      });
    }

    logger.info('Appointment updated', { appointmentId: id, updatedBy: userId });

    // Cache'i invalidate et (hem hasta hem doktor için)
    await invalidateAppointmentCache(appointment.patientId);
    await invalidateAppointmentCache(appointment.doctorId);

    res.json({
      success: true,
      message: 'Randevu güncellendi',
      data: { appointment: updatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Randevu iptal
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    // Yetki kontrolü
    if (userRole === 'PATIENT' && appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu randevuyu iptal etme yetkiniz yok',
      });
    }

    // Zaten iptal edildi mi?
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Randevu zaten iptal edilmiş',
      });
    }

    // Tamamlanan randevu iptal edilemez
    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Tamamlanan randevu iptal edilemez',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Bildirim gönder
    await prisma.notification.create({
      data: {
        userId: userRole === 'DOCTOR' ? appointment.patientId : appointment.doctorId,
        type: 'appointment',
        message: `Randevu iptal edildi`,
      },
    });

    logger.info('Appointment cancelled', { appointmentId: id, cancelledBy: userId });

    // Cache'i invalidate et (hem hasta hem doktor için)
    await invalidateAppointmentCache(appointment.patientId);
    await invalidateAppointmentCache(appointment.doctorId);

    res.json({
      success: true,
      message: 'Randevu iptal edildi',
      data: { appointment: updatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};
