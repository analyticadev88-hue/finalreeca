import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Public read - anyone can see active routes
    const routes = await prisma.route.findMany({
      where: { active: true },
      orderBy: [
        { origin: 'asc' },
        { destination: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(routes);
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    await requireAdminAuth(request);

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.origin || !data.destination) {
      return NextResponse.json(
        { error: 'name, origin, and destination are required' },
        { status: 400 }
      );
    }

    // Upsert instead of create - return existing if already there
    const route = await prisma.route.upsert({
      where: { name: data.name },
      update: {
        origin: data.origin,
        destination: data.destination,
        isStopover: data.isStopover || false,
        active: data.active !== false
      },
      create: {
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        isStopover: data.isStopover || false,
        active: data.active !== false
      }
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Failed to create route' },
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

    // Check if name is being changed and if new name already exists
    if (data.name) {
      const existing = await prisma.route.findFirst({
        where: {
          name: data.name,
          id: { not: data.id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Route with this name already exists' },
          { status: 409 }
        );
      }
    }

    const route = await prisma.route.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.origin && { origin: data.origin }),
        ...(data.destination && { destination: data.destination }),
        ...(typeof data.isStopover === 'boolean' && { isStopover: data.isStopover }),
        ...(typeof data.active === 'boolean' && { active: data.active })
      }
    });

    return NextResponse.json(route);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating route:', error);
    return NextResponse.json(
      { error: 'Failed to update route' },
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
    await prisma.route.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
