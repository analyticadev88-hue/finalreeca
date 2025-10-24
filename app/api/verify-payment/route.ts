import { NextResponse, NextRequest } from 'next/server';

// STRIPE DEPRECATED: This endpoint is deprecated. Use /api/dpo-verify-payment instead.
export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Please use /api/dpo-verify-payment instead.'
  }, { status: 400 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Please use /api/dpo-verify-payment instead.'
  }, { status: 400 });
}