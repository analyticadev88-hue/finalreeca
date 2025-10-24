import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Bulk update request body:", body);

    const { filters, updates } = body;

    // Build SET clause
    const setClauses: string[] = [];
    if (updates.fare) setClauses.push(`"fare" = ${Number(updates.fare)}`);
    if (updates.availableSeats) setClauses.push(`"availableSeats" = ${Number(updates.availableSeats)}`);
    if (updates.totalSeats) setClauses.push(`"totalSeats" = ${Number(updates.totalSeats)}`);
    if (updates.durationMinutes) setClauses.push(`"durationMinutes" = ${Number(updates.durationMinutes)}`);
    if (updates.serviceType && updates.serviceType !== "keep-current") setClauses.push(`"serviceType" = '${updates.serviceType}'`);
    if (updates.departureTime && updates.departureTime !== "keep-current") setClauses.push(`"departureTime" = '${updates.departureTime}'`);
    if (updates.boardingPoint) setClauses.push(`"boardingPoint" = '${updates.boardingPoint}'`);
    if (updates.droppingPoint) setClauses.push(`"droppingPoint" = '${updates.droppingPoint}'`);

    if (setClauses.length === 0) {
      console.error("Bulk update error: No fields to update.");
      return NextResponse.json(
        { message: 'No fields to update.', error: 'No update fields provided.' },
        { status: 400 }
      );
    }

    // Build WHERE clause
    const whereClauses: string[] = [];
    if (filters.routeName && filters.routeName !== "all") whereClauses.push(`"routeName" = '${filters.routeName}'`);
    if (filters.startDate) whereClauses.push(`"departureDate" >= '${filters.startDate}'`);
    if (filters.endDate) whereClauses.push(`"departureDate" <= '${filters.endDate}'`);
    if (typeof filters.hasDeparted === "boolean") whereClauses.push(`"hasDeparted" = ${filters.hasDeparted}`);

    const setClause = setClauses.join(", ");
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `UPDATE "Trip" SET ${setClause} ${whereClause};`;
    console.log("Executing bulk update query:", query);

    // Execute the raw SQL query for bulk updates
    const result = await prisma.$executeRawUnsafe(query);
    console.log("Bulk update result:", result);

    return NextResponse.json({ success: true, updatedCount: result });
  } catch (error) {
    console.error('Error bulk updating trips:', error);
    return NextResponse.json(
      { message: 'Failed to bulk update trips', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
