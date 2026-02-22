// LUMINEX Database Seed
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { tcNo: '10000000146' },
    update: {},
    create: {
      tcNo: '10000000146',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Kullanıcı',
      role: 'ADMIN',
      email: 'admin@luminex.com',
      phone: '05551234567',
      gender: 'OTHER',
    },
  });
  console.log('✅ Admin kullanıcı oluşturuldu:', admin.tcNo);

  // Test doktoru oluştur
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctor = await prisma.user.upsert({
    where: { tcNo: '12345678901' },
    update: {},
    create: {
      tcNo: '12345678901',
      password: doctorPassword,
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      role: 'DOCTOR',
      email: 'ayse.yilmaz@luminex.com',
      phone: '05552345678',
      gender: 'FEMALE',
    },
  });
  console.log('✅ Doktor oluşturuldu:', doctor.tcNo);

  // Test hastası oluştur
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patient = await prisma.user.upsert({
    where: { tcNo: '98765432109' },
    update: {},
    create: {
      tcNo: '98765432109',
      password: patientPassword,
      firstName: 'Ahmet',
      lastName: 'Demir',
      role: 'PATIENT',
      email: 'ahmet.demir@example.com',
      phone: '05553456789',
      gender: 'MALE',
      dateOfBirth: new Date('1990-05-15'),
    },
  });
  console.log('✅ Hasta oluşturuldu:', patient.tcNo);

  // Hastane oluştur
  const hospital = await prisma.hospital.upsert({
    where: { id: 'default-hospital' },
    update: {},
    create: {
      id: 'default-hospital',
      name: 'LUMINEX Merkez Hastanesi',
      address: 'Sağlık Cad. No:123',
      phone: '02121234567',
      email: 'info@luminexhastane.com',
      city: 'İstanbul',
      district: 'Kadıköy',
    },
  });
  console.log('✅ Hastane oluşturuldu:', hospital.name);

  // Departmanlar oluştur
  const departments = [
    { name: 'Kardiyoloji', description: 'Kalp ve damar hastalıkları' },
    { name: 'Dahiliye', description: 'İç hastalıkları' },
    { name: 'Ortopedi', description: 'Kas-iskelet sistemi hastalıkları' },
    { name: 'Göz Hastalıkları', description: 'Göz hastalıkları' },
    { name: 'Çocuk Sağlığı ve Hastalıkları', description: 'Pediatri' },
    { name: 'Kadın Hastalıkları ve Doğum', description: 'Kadın doğum' },
    { name: 'Kulak Burun Boğaz', description: 'KBB hastalıkları' },
    { name: 'Nöroloji', description: 'Sinir sistemi hastalıkları' },
    { name: 'Psikiyatri', description: 'Ruh sağlığı' },
    { name: 'Üroloji', description: 'Ürolojik hastalıklar' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: `dept-${dept.name.toLowerCase()}` },
      update: {},
      create: {
        id: `dept-${dept.name.toLowerCase()}`,
        name: dept.name,
        description: dept.description,
        hospitalId: hospital.id,
      },
    });
  }
  console.log('✅ Departmanlar oluşturuldu');

  // Örnek randevu oluştur
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      hospitalId: hospital.id,
      appointmentDate: tomorrow,
      status: 'PENDING',
      symptoms: 'Baş ağrısı ve halsizlik',
    },
  });
  console.log('✅ Örnek randevu oluşturuldu');

  // Hasta için bildirim oluştur
  await prisma.notification.create({
    data: {
      userId: patient.id,
      type: 'appointment',
      message: 'Randevunuz onay bekliyor',
      isRead: false,
    },
  });
  console.log('✅ Bildirim oluşturuldu');

  console.log('\n✨ Database seeding tamamlandı!');
  console.log('\n📝 Test Hesapları:');
  console.log('   Admin:  TC: 10000000146  Şifre: admin123');
  console.log('   Doktor: TC: 12345678901  Şifre: doctor123');
  console.log('   Hasta:  TC: 98765432109  Şifre: patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
