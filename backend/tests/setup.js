// Test Setup File
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/luminex_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.CACHE_ENABLED = 'false';
process.env.EMAIL_ENABLED = 'false';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    hospital: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    file: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    dbsize: jest.fn(),
    info: jest.fn(),
    ping: jest.fn(),
    on: jest.fn(),
    status: 'ready',
  };

  return {
    default: jest.fn(() => mockRedis),
  };
});

// Mock Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  };
});

// Mock multer
jest.mock('multer', () => {
  return {
    default: jest.fn(() => ({
      single: jest.fn(),
      array: jest.fn(),
      fields: jest.fn(),
      none: jest.fn(),
    })),
  };
});

// Mock Socket.IO
jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      emitToRoom: jest.fn(),
    })),
  };
});

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown hooks
beforeAll(async () => {
  // Run before all tests
  console.log('Starting test suite...');
});

afterAll(async () => {
  // Run after all tests
  console.log('Test suite completed');
});

beforeEach(() => {
  // Run before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Run after each test
  jest.restoreAllMocks();
});
