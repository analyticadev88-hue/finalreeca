// Test script to find the valid clientVersion for Absa's Cybersource sandbox
// Run with: node test-cybersource-version.mjs

import cybersourceRestApi from 'cybersource-rest-client';

const configObj = {
  authenticationType: 'http_signature',
  runEnvironment: 'apitest.cybersource.com',
  merchantID: process.env.CYBERSOURCE_MERCHANT_ID,
  merchantKeyId: process.env.CYBERSOURCE_KEY_ID,
  merchantsecretKey: process.env.CYBERSOURCE_SECRET_KEY,
  keyAlias: process.env.CYBERSOURCE_MERCHANT_ID,
  keyPass: process.env.CYBERSOURCE_MERCHANT_ID,
  keyFileName: process.env.CYBERSOURCE_MERCHANT_ID,
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

// All versions to try — from latest down to legacy
const versionsToTry = [
  '1.2', '1.1', '1.0',
  '0.44', '0.43', '0.42', '0.41', '0.40',
  '0.35', '0.34', '0.33', '0.32', '0.31', '0.30',
  '0.28', '0.27', '0.26', '0.25',
];

async function testVersion(version) {
  return new Promise((resolve) => {
    const apiClient = new cybersourceRestApi.ApiClient();
    const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObj, apiClient);

    const req = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
    req.targetOrigins = ['https://reecabus.co.bw'];
    req.country = 'BW';
    req.locale = 'en_US';
    req.allowedPaymentTypes = ['PANENTRY'];
    req.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
    req.clientVersion = version;

    instance.generateUnifiedCheckoutCaptureContext(req, (error, data) => {
      if (error) {
        const text = error?.response?.text || '';
        let parsed = {};
        try { parsed = JSON.parse(JSON.parse(text)); } catch {}
        const details = parsed?.details?.map(d => d.message).join(', ') || text.slice(0, 120);
        resolve({ version, success: false, error: details });
      } else {
        resolve({ version, success: true, data });
      }
    });
  });
}

async function main() {
  console.log('🔍 Testing clientVersion values against Absa Cybersource sandbox...\n');
  console.log(`Merchant ID: ${process.env.CYBERSOURCE_MERCHANT_ID}\n`);

  for (const version of versionsToTry) {
    const result = await testVersion(version);
    if (result.success) {
      console.log(`✅ SUCCESS with clientVersion: '${version}'`);
      console.log('   Use this value in your code!');
      process.exit(0);
    } else {
      // If error is NOT about clientVersion, it might be a different issue
      const isVersionError = result.error.toLowerCase().includes('clientversion') || result.error.toLowerCase().includes('client version');
      if (!isVersionError) {
        console.log(`⚠️  Version '${version}' — different error (not version related): ${result.error}`);
      } else {
        console.log(`❌ '${version}' — ${result.error}`);
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n❌ No valid version found in the tested range.');
  console.log('👉 Contact Mmoloki at Absa: mmoloki.modise@absa.africa');
}

main().catch(console.error);
