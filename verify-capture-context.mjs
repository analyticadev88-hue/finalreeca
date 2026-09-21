// Verifies sandbox creds + clientVersion 0.35 using the EXACT same payload
// as app/api/create-capture-context/route.ts
// Run: node verify-capture-context.mjs

import cybersourceRestApi from 'cybersource-rest-client';

const MERCHANT_ID = process.env.CYBERSOURCE_MERCHANT_ID || 'absa_1303403_reecatrvl_testbwp';

const configObj = {
  authenticationType: 'http_signature',
  runEnvironment: 'apitest.cybersource.com',
  merchantID: MERCHANT_ID,
  merchantKeyId: process.env.CYBERSOURCE_KEY_ID || '83ad42ef-1a9d-46eb-86dd-cff9f28a6c6e',
  merchantsecretKey: process.env.CYBERSOURCE_SECRET_KEY || 'vyCvKlBKOCWrIJCb8pK92nj30b4bq4A7eO8wVGQX3j0=',
  keyAlias: MERCHANT_ID,
  keyPass: MERCHANT_ID,
  keyFileName: MERCHANT_ID,
  keysDirectory: './',
  logConfiguration: { enableLog: false },
};

const apiClient = new cybersourceRestApi.ApiClient();
const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObj, apiClient);

const req = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
req.targetOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];
req.country = 'BW';
req.locale = 'en_US';
req.clientVersion = '0.35';
req.allowedPaymentTypes = ['PANENTRY'];
req.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
req.data = {
  orderInformation: {
    amountDetails: { totalAmount: '100.00', currency: 'BWP' },
    billTo: {
      firstName: 'Test', lastName: 'User', email: 'test@example.com',
      country: 'BW', address1: 'Gaborone', administrativeArea: 'Gaborone',
      buildingNumber: '1', locality: 'Gaborone', postalCode: '0000', phoneNumber: '0000000000',
    },
  },
  clientReferenceInformation: { code: 'TEST123' },
};

instance.generateUnifiedCheckoutCaptureContext(req, (error, data) => {
  if (error) {
    console.error('❌ FAILED:', error?.response?.text || error);
    process.exit(1);
  }
  console.log('✅ Capture context generated successfully');
  console.log('Response length:', String(data).length, 'chars');
  console.log('First 120 chars:', String(data).slice(0, 120));
});
