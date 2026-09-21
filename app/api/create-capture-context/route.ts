import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cybersourceRestApi from 'cybersource-rest-client';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import * as reservationService from '@/lib/reservationService';

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { totalPrice, userName, userEmail, selectedSeats, tripId, userPhone, userAddress } = body;

    if (!tripId || !totalPrice || !userName || !userEmail || !selectedSeats?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = body.orderId || Math.floor(100000 + Math.random() * 900000).toString();
    const bookingData = { ...body, orderId };

    // Set up reservations
    const seatsArray = Array.isArray(selectedSeats)
      ? selectedSeats.map((s: any) => (typeof s === 'object' ? s?.seatNumber ?? s : s))
      : [];
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    for (const seat of seatsArray) {
      try {
        await reservationService.createReservation({ tripId, seatNumber: String(seat), reservedBy: orderId, expiresAt });
      } catch (err: any) {
        if (err?.code === 'P2002' || /unique/i.test(err?.message || '')) {
          return NextResponse.json({ error: `Seat ${seat} is no longer available.` }, { status: 409 });
        }
        throw err;
      }
    }

    // Create DB Booking
    let booking;
    try {
      booking = await createBookingWithRetry(bookingData);
    } catch (err: any) {
      return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
    }

    // Initialize Cybersource
    const configObj = {
      authenticationType: 'http_signature',
      runEnvironment: 'apitest.cybersource.com',
      merchantID: process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp',
      merchantKeyId: process.env.CYBERSOURCE_KEY_ID || '83ad42ef-1a9d-46eb-86dd-cff9f28a6c6e',
      merchantsecretKey: process.env.CYBERSOURCE_SECRET_KEY || 'vyCvKlBKOCWrIJCb8pK92nj30b4bq4A7eO8wVGQX3j0=',
      keyAlias: process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp',
      keyPass: process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp',
      keyFileName: process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp',
      keysDirectory: './',
      logConfiguration: {
        enableLog: false,
        logFileName: 'cybs',
        logDirectory: 'log',
        logFileMaxSize: '5242880',
        loggingLevel: 'debug',
        enableMasking: true,
      },
    };

    const apiClient = new cybersourceRestApi.ApiClient();
    const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObj, apiClient);

    // Accept the calling page's origin so deploy previews / dev domains work;
    // always include the configured app URL as well.
    const requestOrigin = request.headers.get('origin');
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reecabus.co.bw';
    const sanitizedConfigured = configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl;
    const sanitizedOrigin = requestOrigin && /^https:\/\//.test(requestOrigin)
      ? requestOrigin.replace(/\/$/, '')
      : null;
    const targetOrigins = [...new Set([sanitizedOrigin, sanitizedConfigured].filter(Boolean))];

    const captureContextRequest = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
    captureContextRequest.targetOrigins = targetOrigins;
    captureContextRequest.country = 'BW';
    captureContextRequest.locale = 'en_US';
    captureContextRequest.clientVersion = '0.35';
    captureContextRequest.allowedPaymentTypes = ['PANENTRY'];
    captureContextRequest.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
    captureContextRequest.data = {
      orderInformation: {
        amountDetails: {
          totalAmount: String(totalPrice),
          currency: 'BWP',
        },
        billTo: {
          firstName: userName.split(' ')[0] || userName,
          lastName: userName.split(' ')[1] || 'N/A',
          email: userEmail,
          country: 'BW',
          address1: userAddress || 'Gaborone',
          administrativeArea: 'Gaborone',
          buildingNumber: '1',
          locality: 'Gaborone',
          postalCode: '0000',
          phoneNumber: (userPhone || '0000000000').replace(/\D/g, '').slice(0, 15),
        },
      },
      clientReferenceInformation: {
        code: orderId,
      },
    };

    const response = await new Promise((resolve, reject) => {
      instance.generateUnifiedCheckoutCaptureContext(captureContextRequest, function(error: any, data: any, response: any) {
        if (error) {
          console.error('Cybersource Error:', error);
          reject(error);
        } else {
          resolve(data);
        }
      });
    });

    return NextResponse.json({
      captureContext: response,
      orderId,
    });

  } catch (error: any) {
    console.error('Cybersource Session Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}