// Auth API Tests
import request from 'supertest';
import app from '../src/server.js';
import prisma from '../src/config/database.js';

describe('Auth API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const uniqueTC = `${Date.now().toString().slice(-11)}`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          tcNo: uniqueTC,
          password: 'test123456',
          firstName: 'Test',
          lastName: 'User',
          role: 'PATIENT',
          email: `test${Date.now()}@example.com`,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('token');
      expect(response.body.data.user.tcNo).toBe(uniqueTC);
    });

    it('should fail with invalid TC number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          tcNo: '12345678901',
          password: 'test123456',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Geçersiz TC Kimlik Numarası');
    });

    it('should fail with short password', async () => {
      const uniqueTC = `${Date.now().toString().slice(-11)}`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          tcNo: uniqueTC,
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate TC number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          tcNo: '10000000146',
          password: 'test123456',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('zaten kayıtlı');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          tcNo: '10000000146',
          password: 'admin123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('token');
      expect(response.body.data.user.role).toBe('ADMIN');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          tcNo: '10000000146',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          tcNo: '99999999999',
          password: 'test123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          tcNo: '10000000146',
          password: 'admin123',
        });
      token = loginResponse.body.data.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.role).toBe('ADMIN');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
