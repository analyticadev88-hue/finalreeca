import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Simple retry helper for transient DB operations. Retries the provided async fn up to maxRetries
// with exponential backoff plus jitter. Use for operations that may fail due to intermittent
// connectivity to the DB (for example in serverless environments or flaky network).
export async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 4, baseDelay = 300) : Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const jitter = Math.floor(Math.random() * 200);
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      const code = err?.code || err?.name || 'UNKNOWN_ERROR';
      console.warn(`Prisma retry attempt ${attempt} after error (code=${code}): ${err?.message || err}. Retrying in ${delay}ms`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}