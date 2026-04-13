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

/**
 * DPO Webhook (Push URL) handler.
 * DPO calls this endpoint independently when a transaction's status changes.
 */
export async function POST(request: NextRequest) {
  return handleDpoNotification(request);
}

export async function GET(request: NextRequest) {
  return handleDpoNotification(request);
}

async function handleDpoNotification(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // DPO can send data via query params or XML body
    let transactionToken = searchParams.get('TransToken') || searchParams.get('TransactionToken');
    let orderId = searchParams.get('CompanyRef') || searchParams.get('order_id');
    
    // If not in query params, check body (DPO sometimes sends XML)
    if (!transactionToken) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        const bodyText = await request.text();
        const parsedBody: any = await parseXML(bodyText).catch(() => null);
        if (parsedBody && (parsedBody.API3G || parsedBody.api3g)) {
          const api3g = parsedBody.API3G || parsedBody.api3g;
          transactionToken = api3g.TransToken?.[0] || api3g.TransToken;
          orderId = api3g.CompanyRef?.[0] || api3g.CompanyRef;
        }
      }
    }

    if (!transactionToken && !orderId) {
      console.error('[DPO-WEBHOOK] Missing identification parameters');
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    console.log(`[DPO-WEBHOOK] Received update for Order: ${orderId}, Token: ${transactionToken}`);

    // Get booking from DB
    const booking = await prisma.booking.findFirst({
      where: orderId ? { orderId } : { transactionToken },
    });

    if (!booking) {
      console.error(`[DPO-WEBHOOK] Booking not found for Order: ${orderId}`);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Use the token to verify status with DPO API directly
    const tokenToVerify = transactionToken || booking.transactionToken;
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${tokenToVerify}</TransactionToken>
  <VerifyTransaction>1</VerifyTransaction>
</API3G>`;

    const response = await fetch('https://secure.3gdirectpay.com/API/v6/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlData,
    });

    if (!response.ok) {
      throw new Error(`DPO API HTTP error: ${response.status}`);
    }

    const responseText = await response.text();
    const parsedResponse: any = await parseXML(responseText);
    const api3g = parsedResponse.API3G || parsedResponse.api3g;
    const result = api3g.Result?.[0] || api3g.Result;
    const resultExplanation = api3g.ResultExplanation?.[0] || api3g.ResultExplanation;

    let paymentStatus = 'pending';
    if (result === '000') paymentStatus = 'paid';
    else if (['900', '901', '904'].includes(result)) paymentStatus = 'cancelled';

    console.log(`[DPO-WEBHOOK] Status for ${orderId}: ${paymentStatus} (${resultExplanation})`);

    // Update booking in DB
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus,
        transactionToken: tokenToVerify,
      },
    });

    // Mandatory DPO XML response for Push URL acknowledgment
    // DPO expects an XML response to stop retrying the notification
    const dpoAck = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <Response>OK</Response>
</API3G>`;

    return new Response(dpoAck, {
      headers: { 'Content-Type': 'application/xml' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[DPO-WEBHOOK] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
