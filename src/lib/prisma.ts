let prismaInstance: any = null;

try {
  // Dynamic require to prevent Netlify build failure when Prisma client is ungenerated
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as {
    prisma: any;
  };

  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
} catch (e) {
  console.warn('PrismaClient dynamic load notice:', e);
}

export const prisma = prismaInstance;
