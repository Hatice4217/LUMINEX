// Database Configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test ortamında global bağlantıyı önle
if (process.env.NODE_ENV !== 'test') {
  // Prisma'ya global olarak bağlan
  if (!global.prisma) {
    global.prisma = prisma;
  }
}

// Graceful shutdown için
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
