// Swagger Configuration
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LUMINEX Sağlık Yönetim Sistemi API',
      version: '1.0.0',
      description: `
LUMINEX Sağlık Yönetim Sistemi REST API Dokümantasyonu.

## Özellikler
- JWT tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme (HASTA, DOKTOR, ADMIN)
- Randevu yönetimi
- Doktor ve hastane arama
- Bildirim sistemi

## Kimlik Doğrulama
API'nin korumalı endpoint'lerine erişmek için JWT token gereklidir.

\`\`\`javascript
Authorization: Bearer <token>
\`\`\`

## Hata Kodları
- \`200\` - Başarılı
- \`201\` - Oluşturuldu
- \`400\` - Geçersiz istek
- \`401\` - Yetkisiz
- \`403\` - Yasaklı
- \`404\` - Bulunamadı
- \`500\` - Sunucu hatası
      `,
      contact: {
        name: 'LUMINEX API Support',
        email: 'support@luminex.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'https://luminex-backend.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token ile yetkilendirme. Token\'ı login endpoint\'inden alın.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Kullanıcı benzersiz ID',
            },
            tcNo: {
              type: 'string',
              minLength: 11,
              maxLength: 11,
              pattern: '^[0-9]{11}$',
              description: 'TC Kimlik Numarası',
            },
            firstName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'İsim',
            },
            lastName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Soyisim',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email adresi',
            },
            phone: {
              type: 'string',
              pattern: '^05[0-9]{9}$',
              description: 'Telefon numarası (05XX XXX XX XX)',
            },
            role: {
              type: 'string',
              enum: ['PATIENT', 'DOCTOR', 'ADMIN'],
              description: 'Kullanıcı rolü',
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER'],
              description: 'Cinsiyet',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Doğum tarihi',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Kayıt tarihi',
            },
          },
          required: ['id', 'tcNo', 'firstName', 'lastName', 'role'],
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Randevu benzersiz ID',
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Hasta ID',
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doktor ID',
            },
            hospitalId: {
              type: 'string',
              format: 'uuid',
              description: 'Hastane ID',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              description: 'Bölüm ID',
            },
            appointmentDate: {
              type: 'string',
              format: 'date-time',
              description: 'Randevu tarihi ve saati',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              description: 'Randevu durumu',
            },
            notes: {
              type: 'string',
              maxLength: 500,
              description: 'Notlar',
            },
            symptoms: {
              type: 'string',
              maxLength: 500,
              description: 'Şikayetler',
            },
            diagnosis: {
              type: 'string',
              description: 'Teşhis',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi',
            },
          },
          required: ['id', 'patientId', 'doctorId', 'hospitalId', 'appointmentDate', 'status'],
        },
        Hospital: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
            },
            city: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
            },
            district: {
              type: 'string',
              maxLength: 50,
            },
            address: {
              type: 'string',
              maxLength: 500,
            },
            phone: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            website: {
              type: 'string',
              format: 'uri',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Hata mesajı',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: {
                    type: 'string',
                    description: 'Hata mesajı',
                  },
                  param: {
                    type: 'string',
                    description: 'Hatalı parametre',
                  },
                  location: {
                    type: 'string',
                    description: 'Hata konumu (body, query, params)',
                  },
                },
              },
            },
          },
          required: ['success', 'message'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Başarı mesajı',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
          required: ['success'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Kimlik doğrulama işlemleri (kayıt, giriş, şifre işlemleri)',
      },
      {
        name: 'Appointments',
        description: 'Randevu yönetimi',
      },
      {
        name: 'Users',
        description: 'Kullanıcı işlemleri',
      },
      {
        name: 'Doctors',
        description: 'Doktor işlemleri ve arama',
      },
      {
        name: 'Hospitals',
        description: 'Hastane işlemleri',
      },
      {
        name: 'Notifications',
        description: 'Bildirim yönetimi',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
