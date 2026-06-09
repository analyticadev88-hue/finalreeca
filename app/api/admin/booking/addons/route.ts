// Admin-only endpoint to add or remove addons from an existing booking.
// No Stripe — the customer pays at the office and the admin records it.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import jwt from "jsonwebtoken";
import {
  ADDON_CATALOG,
  getAddonById,
  calculateAddonTotal,
  normalizeAddons,
  type BookingAddonItem,
} from "@/lib/addons";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

async function verifyConsultantAuth(req: NextRequest) {
  const token = req.cookies.get("consultant_token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload?.id) return null;
    const consultant = await prisma.consultant.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true },
    });
    return consultant;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth();
  const consultant = !auth.authorized ? await verifyConsultantAuth(req) : null;
  if (!auth.authorized && !consultant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, catalogId, quantity, note } = body as {
      bookingId: string;
      catalogId: string;
      quantity: number;
      note?: string;
    };

    if (!bookingId || !catalogId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Missing bookingId, catalogId or quantity" },
        { status: 400 }
      );
    }

    const addonDef = getAddonById(catalogId);
    if (!addonDef) {
      return NextResponse.json(
        { error: "Unknown addon. Available: " + ADDON_CATALOG.map((a) => a.id).join(", ") },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const existingAddons = normalizeAddons(booking.addons);
    const addonTotal = calculateAddonTotal(addonDef.pricePerPassenger, quantity);

    const newAddon: BookingAddonItem = {
      catalogId: addonDef.id,
      name: note ? `${addonDef.name} — ${note}` : addonDef.name,
      pricePerPassenger: addonDef.pricePerPassenger,
      quantity,
      totalPrice: addonTotal,
      addedAt: new Date().toISOString(),
      addedBy: consultant?.name || auth.session?.user?.email || "admin",
    };

    const updatedAddons = [...existingAddons, newAddon];
    const newTotalPrice = booking.totalPrice + addonTotal;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        addons: updatedAddons as any,
        totalPrice: newTotalPrice,
      },
    });

    return NextResponse.json({
      success: true,
      addon: newAddon,
      newTotalPrice,
      addons: updatedAddons,
    });
  } catch (err: any) {
    console.error("[admin/booking/addons] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminAuth();
  const consultant = !auth.authorized ? await verifyConsultantAuth(req) : null;
  if (!auth.authorized && !consultant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const indexParam = searchParams.get("index");

    if (!bookingId || indexParam === null) {
      return NextResponse.json(
        { error: "Missing bookingId or index" },
        { status: 400 }
      );
    }

    const index = parseInt(indexParam, 10);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const existingAddons = normalizeAddons(booking.addons);
    if (index < 0 || index >= existingAddons.length) {
      return NextResponse.json({ error: "Invalid addon index" }, { status: 400 });
    }

    const removedAddon = existingAddons[index];
    const updatedAddons = existingAddons.filter((_, i) => i !== index);
    const newTotalPrice = Math.max(
      0,
      booking.totalPrice - (removedAddon.totalPrice || 0)
    );

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        addons: updatedAddons.length > 0 ? (updatedAddons as any) : null,
        totalPrice: newTotalPrice,
      },
    });

    return NextResponse.json({
      success: true,
      removedAddon,
      newTotalPrice,
      addons: updatedAddons,
    });
  } catch (err: any) {
    console.error("[admin/booking/addons] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
