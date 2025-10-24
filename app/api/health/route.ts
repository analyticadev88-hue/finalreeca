import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'healthy', database: 'connected' });
  } catch (error: any) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 });
  }
}