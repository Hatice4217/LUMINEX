// Appointment Endpoint Tests
import { describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    hospital: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

import { PrismaClient } from '@prisma/client';
import appointmentRoutes from '../../src/routes/appointmentRoutes.js';

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

const prisma = new PrismaClient();

// Test helpers
let patientToken, doctorToken, adminToken;

beforeAll(async () => {
  const { generateToken } = await import('../../src/utils/jwt-utils.js');

  patientToken = generateToken({
    userId: 'patient-123',
    tcNo: '11111111111',
    role: 'PATIENT',
  });

  doctorToken = generateToken({
    userId: 'doctor-123',
    tcNo: '22222222222',
    role: 'DOCTOR',
  });

  adminToken = generateToken({
    userId: 'admin-123',
    tcNo: '33333333333',
    role: 'ADMIN',
  });
});

describe('POST /api/appointments', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Geçerli gelecek tarihi oluştur
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);

  const validAppointment = {
    hospitalId: 'hospital-123',
    doctorId: 'doctor-123',
    departmentId: 'dept-123',
    appointmentDate: futureDate.toISOString().split('T')[0], // Gelecek tarih
    notes: 'Baş ağrısı şikayeti',
    symptoms: 'Baş dönmesi, mide bulantısı',
  };

  test('Hasta randevu oluşturabilmeli (201)', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'doctor-123',
      firstName: 'Dr. Ayşe',
      lastName: 'Demir',
      role: 'DOCTOR',
    });

    prisma.hospital.findUnique.mockResolvedValue({
      id: 'hospital-123',
      name: 'Şehir Hastanesi',
      city: 'İstanbul',
    });

    prisma.appointment.create.mockResolvedValue({
      id: 'apt-123',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      hospitalId: 'hospital-123',
      departmentId: 'dept-123',
      appointmentDate: new Date('2025-06-15'),
      status: 'PENDING',
      notes: 'Baş ağrısı şikayeti',
      symptoms: 'Baş dönmesi, mide bulantısı',
      doctor: { id: 'doctor-123', firstName: 'Dr. Ayşe', lastName: 'Demir', role: 'DOCTOR' },
      hospital: { id: 'hospital-123', name: 'Şehir Hastanesi', city: 'İstanbul' },
    });

    prisma.notification.create.mockResolvedValue({});

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(validAppointment)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Randevu talebi oluşturuldu');
    expect(response.body.data.appointment).toBeDefined();
    expect(response.body.data.appointment.status).toBe('PENDING');
  });

  test('Admin randevu oluşturabilmeli (201)', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'doctor-123', role: 'DOCTOR' });
    prisma.hospital.findUnique.mockResolvedValue({ id: 'hospital-123' });
    prisma.appointment.create.mockResolvedValue({
      id: 'apt-456',
      status: 'PENDING',
      doctor: { id: 'doctor-123', firstName: 'Dr.', lastName: 'Test', role: 'DOCTOR' },
      hospital: { id: 'hospital-123', name: 'Test', city: 'Test' },
    });
    prisma.notification.create.mockResolvedValue({});

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validAppointment)
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  test('Doktor randevu oluşturamaz (403)', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(validAppointment)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('yetkiniz yok');
  });

  test('Token yoksa 401 dönmeli', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send(validAppointment)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Geçersiz tarih 400 dönmeli', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ...validAppointment,
        appointmentDate: '2020-01-01', // Geçmiş tarih
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Geçersiz randevu tarihi');
  });

  test('Doktor bulunamazsa 404 dönmeli', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    // Geçerli bir tarih kullan (6 ay sonrası)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ...validAppointment,
        appointmentDate: futureDate.toISOString().split('T')[0],
      })
      .expect(404);

    expect(response.body.message).toContain('Doktor bulunamadı');
  });

  test('Hastane bulunamazsa 404 dönmeli', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'doctor-123', role: 'DOCTOR' });
    prisma.hospital.findUnique.mockResolvedValue(null);

    // Geçerli bir tarih kullan (6 ay sonrası)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ...validAppointment,
        appointmentDate: futureDate.toISOString().split('T')[0],
      })
      .expect(404);

    expect(response.body.message).toContain('Hastane bulunamadı');
  });

  test('Validasyon hatası: hospitalId eksik', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: 'doctor-123',
        appointmentDate: '2025-06-15',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('Validasyon hatası: doctorId eksik', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        hospitalId: 'hospital-123',
        appointmentDate: '2025-06-15',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/appointments', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Hasta kendi randevularını görebilmeli', async () => {
    prisma.appointment.findMany.mockResolvedValue([
      {
        id: 'apt-1',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        status: 'PENDING',
        appointmentDate: new Date('2025-06-15'),
        doctor: { id: 'doctor-123', firstName: 'Dr. Ayşe', lastName: 'Demir', role: 'DOCTOR' },
        patient: { id: 'patient-123', firstName: 'Ahmet', lastName: 'Yılmaz' },
        hospital: { id: 'hospital-123', name: 'Şehir Hastanesi', city: 'İstanbul' },
      },
    ]);

    const response = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.appointments).toBeInstanceOf(Array);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientId: 'patient-123' }),
      })
    );
  });

  test('Doktor kendi randevularını görebilmeli', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ doctorId: 'doctor-123' }),
      })
    );
  });

  test('Status filtresi çalışmalı', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    await request(app)
      .get('/api/appointments?status=CONFIRMED')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patientId: 'patient-123',
          status: 'CONFIRMED',
        }),
      })
    );
  });

  test('Tarih aralığı filtresi çalışmalı', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    await request(app)
      .get('/api/appointments?startDate=2025-06-01&endDate=2025-06-30')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    const callArgs = prisma.appointment.findMany.mock.calls[0][0];
    expect(callArgs.where.appointmentDate.gte).toEqual(new Date('2025-06-01'));
    expect(callArgs.where.appointmentDate.lte).toEqual(new Date('2025-06-30'));
  });

  test('Randevular tarihe göre sıralanmalı', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { appointmentDate: 'asc' },
      })
    );
  });
});

describe('GET /api/appointments/:id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockAppointment = {
    id: 'apt-123',
    patientId: 'patient-123',
    doctorId: 'doctor-123',
    hospitalId: 'hospital-123',
    status: 'PENDING',
    appointmentDate: new Date('2025-06-15'),
    notes: 'Test notes',
    doctor: { id: 'doctor-123', firstName: 'Dr. Ayşe', lastName: 'Demir', role: 'DOCTOR', phone: '555-1234' },
    patient: { id: 'patient-123', firstName: 'Ahmet', lastName: 'Yılmaz', phone: '555-5678' },
    hospital: { id: 'hospital-123', name: 'Şehir Hastanesi', address: 'Test cad.', phone: '555-9999' },
  };

  test('Hasta kendi randevusunu görebilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .get('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.appointment.id).toBe('apt-123');
  });

  test('Doktor ilgili randevuyu görebilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .get('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('Hasta başka hastanın randevusunu göremez (403)', async () => {
    const otherPatientToken = generateTokenSync({ userId: 'other-patient', role: 'PATIENT' });
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .get('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .expect(403);

    expect(response.body.message).toContain('yetkiniz yok');
  });

  test('Doktor kendi randevusu olmayanı göremez (403)', async () => {
    const otherDoctorToken = generateTokenSync({ userId: 'other-doctor', role: 'DOCTOR' });
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .get('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${otherDoctorToken}`)
      .expect(403);

    expect(response.body.message).toContain('yetkiniz yok');
  });

  test('Randevu bulunamazsa 404 dönmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/appointments/non-existent')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);

    expect(response.body.message).toContain('bulunamadı');
  });
});

describe('PUT /api/appointments/:id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockAppointment = {
    id: 'apt-123',
    patientId: 'patient-123',
    doctorId: 'doctor-123',
    status: 'PENDING',
    appointmentDate: new Date('2025-06-15'),
  };

  test('Hasta kendi randevusunu güncelleyebilmeli (notes)', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({
      ...mockAppointment,
      notes: 'Güncellenmiş notlar',
    });

    const response = await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ notes: 'Güncellenmiş notlar' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('güncellendi');
  });

  test('Doktor randevu durumunu güncelleyebilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({
      ...mockAppointment,
      status: 'CONFIRMED',
    });
    prisma.notification.create.mockResolvedValue({});

    const response = await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('Doktor teşnis koyabilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({
      ...mockAppointment,
      diagnosis: 'Migren',
    });

    const response = await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ diagnosis: 'Migren' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('Hasta teşnis koyamaz (403)', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ diagnosis: 'Kendi teşhimim' })
      .expect(403);

    expect(response.body.message).toContain('doktor olmalısınız');
  });

  test('Hasta başkasının randevusunu güncelleyemez (403)', async () => {
    const otherPatientToken = generateTokenSync({ userId: 'other-patient', role: 'PATIENT' });
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .send({ notes: 'Hack attempt' })
      .expect(403);

    expect(response.body.message).toContain('yetkiniz yok');
  });

  test('Randevu bulunamazsa 404 dönmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/appointments/non-existent')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ notes: 'Test' })
      .expect(404);

    expect(response.body.message).toContain('bulunamadı');
  });

  test('Durum değişikliği bildirim göndermeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' });
    prisma.notification.create.mockResolvedValue({});

    await request(app)
      .put('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200);

    expect(prisma.notification.create).toHaveBeenCalled();
  });
});

describe('DELETE /api/appointments/:id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockAppointment = {
    id: 'apt-123',
    patientId: 'patient-123',
    doctorId: 'doctor-123',
    status: 'PENDING',
    appointmentDate: new Date('2025-06-15'),
  };

  test('Hasta kendi randevusunu iptal edebilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' });
    prisma.notification.create.mockResolvedValue({});

    const response = await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('iptal edildi');
  });

  test('Doktor randevuyu iptal edebilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' });
    prisma.notification.create.mockResolvedValue({});

    const response = await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('Zaten iptal edilmiş randevu 400 dönmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      ...mockAppointment,
      status: 'CANCELLED',
    });

    const response = await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(400);

    expect(response.body.message).toContain('zaten iptal edilmiş');
  });

  test('Tamamlanmış randevu iptal edilemez (400)', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      ...mockAppointment,
      status: 'COMPLETED',
    });

    const response = await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(400);

    expect(response.body.message).toContain('Tamamlanan randevu iptal edilemez');
  });

  test('Hasta başkasının randevusunu iptal edemez (403)', async () => {
    const otherPatientToken = generateTokenSync({ userId: 'other-patient', role: 'PATIENT' });
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

    const response = await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .expect(403);

    expect(response.body.message).toContain('yetkiniz yok');
  });

  test('Randevu bulunamazsa 404 dönmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/appointments/non-existent')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);

    expect(response.body.message).toContain('bulunamadı');
  });

  test('İptal bildirimi gönderilmeli', async () => {
    prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' });
    prisma.notification.create.mockResolvedValue({});

    await request(app)
      .delete('/api/appointments/apt-123')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'appointment',
          message: expect.stringContaining('iptal'),
        }),
      })
    );
  });
});

// Helper function for generating tokens in tests
function generateTokenSync(payload) {
  const { generateToken } = require('../../src/utils/jwt-utils.js');
  return generateToken({ ...payload, userId: payload.userId || payload.id, tcNo: '12345678901' });
}
