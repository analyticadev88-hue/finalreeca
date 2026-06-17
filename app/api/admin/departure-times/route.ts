import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Public read - anyone can see active times
    const times = await prisma.departureTime.findMany({
      where: { active: true },
      orderBy: { time: 'asc' }
    });

    return NextResponse.json(times);
  } catch (error: any) {
    console.error('Error fetching departure times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departure times' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    await requireAdminAuth(request);

    const data = await request.json();

    if (!data.time) {
      return NextResponse.json(
        { error: 'time is required (format: HH:MM)' },
        { status: 400 }
      );
    }

    // Validate time format HH:MM
    if (!/^([0-1]\d|2[0-3]):[0-5]\d$/.test(data.time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Upsert instead of create - return existing if already there
    const time = await prisma.departureTime.upsert({
      where: { time: data.time },
      update: {
        active: data.active !== false
      },
      create: {
        time: data.time,
        active: data.active !== false
      }
    });

    return NextResponse.json(time, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating departure time:', error);
    return NextResponse.json(
      { error: 'Failed to create departure time' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin only
    await requireAdminAuth(request);

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Check if time is being changed and if new time already exists
    if (data.time) {
      if (!/^([0-1]\d|2[0-3]):[0-5]\d$/.test(data.time)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:MM' },
          { status: 400 }
        );
      }

      const existing = await prisma.departureTime.findFirst({
        where: {
          time: data.time,
          id: { not: data.id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Time already exists' },
          { status: 409 }
        );
      }
    }

    const time = await prisma.departureTime.update({
      where: { id: data.id },
      data: {
        ...(data.time && { time: data.time }),
        ...(typeof data.active === 'boolean' && { active: data.active })
      }
    });

    return NextResponse.json(time);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating departure time:', error);
    return NextResponse.json(
      { error: 'Failed to update departure time' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin only
    await requireAdminAuth(request);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Don't actually delete - just mark as inactive
    await prisma.departureTime.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting departure time:', error);
    return NextResponse.json(
      { error: 'Failed to delete departure time' },
      { status: 500 }
    );
  }
}
