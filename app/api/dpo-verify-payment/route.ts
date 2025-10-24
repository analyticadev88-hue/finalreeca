import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xml2js from 'xml2js';

const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN || '3725588D-FFEA-4501-B489-E9ABFEA89A04';

const parseXML = async (xml: string) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err: Error | null, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const transactionToken = searchParams.get('transaction_token');

    if (!orderId && !transactionToken) {
      return NextResponse.json({ error: 'Order ID or transaction token is required' }, { status: 400 });
    }

    // Get booking from DB
    const booking = await prisma.booking.findFirst({
      where: orderId ? { orderId } : { transactionToken },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Use transactionToken for verification
    const token = transactionToken || booking.transactionToken;
    if (!token) {
      return NextResponse.json({ error: 'No transaction token found for booking' }, { status: 400 });
    }

    // Build XML for DPO verifyToken
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>\n<API3G>\n  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>\n  <Request>verifyToken</Request>\n  <TransactionToken>${token}</TransactionToken>\n  <VerifyTransaction>1</VerifyTransaction>\n</API3G>`;

    const response = await fetch('https://secure.3gdirectpay.com/API/v6/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlData,
    });
    if (!response.ok) {
      throw new Error(`DPO API HTTP error: ${response.status} ${response.statusText}`);
    }
    const responseText = await response.text();
    const parsedResponse = await parseXML(responseText);
    const api3g = (parsedResponse as any).API3G || (parsedResponse as any).api3g;
    const result = api3g.Result?.[0] || api3g.Result;
    const resultExplanation = api3g.ResultExplanation?.[0] || api3g.ResultExplanation;

    let paymentStatus = 'pending';
    if (result === '000') paymentStatus = 'paid';
    else if (result === '900' || result === '901' || result === '904') paymentStatus = 'cancelled';

    // Update booking in DB
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus,
        transactionToken: token,
      },
      include: { passengers: true },
    });

    return NextResponse.json({
      success: paymentStatus === 'paid',
      orderId: booking.orderId,
      paymentStatus,
      booking: updatedBooking,
      dpo: {
        result,
        resultExplanation,
      },
    });
  } catch (error: any) {
    console.error('[DPO-VERIFY] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
