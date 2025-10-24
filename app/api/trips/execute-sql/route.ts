import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    // Execute the raw SQL query
    const result = await prisma.$executeRawUnsafe(query);

    return NextResponse.json({ success: true, affectedRows: result });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return NextResponse.json(
      { message: 'Failed to execute SQL query', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
