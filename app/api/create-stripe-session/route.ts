import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { deduplicateRequest } from '@/utils/requestDeduplication';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";

// STRIPE DEPRECATED: This endpoint is deprecated. Use /api/create-dpo-session instead.

const AGENT_JWT_SECRET = process.env.JWT_SECRET || "topo123";
const CONSULTANT_JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

interface BookingRequest {
  tripId: string;
  totalPrice: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  boardingPoint: string;
  droppingPoint: string;
  selectedSeats: string[];
  passengers: Array<{
    firstName: string;
    lastName: string;
    seatNumber: string;
    title: string;
  }>;
  paymentMode?: string;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  returnSeats?: string[];
  contactDetails?: any;
  emergencyContact?: any;
  promoCode?: string;
  discountAmount?: number;
  orderId?: string;
  agentId?: string;
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Please use /api/create-dpo-session instead.'
  }, { status: 400 });
}
