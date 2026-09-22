import { NextRequest, NextResponse } from 'next/server';
import cybersourceRestApi from 'cybersource-rest-client';

// DEV-ONLY payment test endpoint. Generates a capture context WITHOUT creating
// a booking or holding seats, so certification scenarios can be triggered
// directly.
// ⚠️ DEV BRANCH ONLY — must NOT be merged to main/production.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const merchantID = process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp';
    const configObj = {
      authenticationType: 'http_signature',
      runEnvironment: 'apitest.cybersource.com',
      merchantID,
      merchantKeyId: process.env.CYBERSOURCE_KEY_ID || '83ad42ef-1a9d-46eb-86dd-cff9f28a6c6e',
      merchantsecretKey: process.env.CYBERSOURCE_SECRET_KEY || 'vyCvKlBKOCWrIJCb8pK92nj30b4bq4A7eO8wVGQX3j0=',
      keyAlias: merchantID,
      keyPass: merchantID,
      keyFileName: merchantID,
      keysDirectory: './',
      logConfiguration: { enableLog: false },
    };

    // Same origin handling as the real checkout route
    const requestOrigin = request.headers.get('origin');
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reecabus.co.bw';
    const sanitizedConfigured = configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl;
    const sanitizedOrigin = requestOrigin && /^https:\/\//.test(requestOrigin)
      ? requestOrigin.replace(/\/$/, '')
      : null;
    const targetOrigins = [...new Set([sanitizedOrigin, sanitizedConfigured].filter(Boolean))];

    const apiClient = new cybersourceRestApi.ApiClient();
    const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObj, apiClient);

    const captureContextRequest = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
    captureContextRequest.targetOrigins = targetOrigins;
    captureContextRequest.country = 'BW';
    captureContextRequest.locale = 'en_US';
    captureContextRequest.clientVersion = '0.35';
    captureContextRequest.allowedPaymentTypes = ['PANENTRY'];
    captureContextRequest.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
    captureContextRequest.completeMandate = { type: 'CAPTURE' };
    captureContextRequest.data = {
      orderInformation: {
        amountDetails: { totalAmount: amount.toFixed(2), currency: 'BWP' },
        billTo: {
          firstName: 'Test',
          lastName: 'Developer',
          email: 'analyticadev88@gmail.com',
          country: 'BW',
          address1: 'Gaborone',
          administrativeArea: 'Gaborone',
          buildingNumber: '1',
          locality: 'Gaborone',
          postalCode: '0000',
          phoneNumber: '0000000000',
        },
      },
      clientReferenceInformation: { code: `TEST-${Date.now()}` },
    };

    const captureContext = await new Promise((resolve, reject) => {
      instance.generateUnifiedCheckoutCaptureContext(captureContextRequest, (error: any, data: any) => {
        if (error) reject(error);
        else resolve(data);
      });
    });

    return NextResponse.json({ captureContext });
  } catch (error: any) {
    console.error('Dev test capture context error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
