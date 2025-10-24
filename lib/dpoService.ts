import axios from 'axios';
import xml2js from 'xml2js';

export interface CreateTokenRequest {
  tripId: string;
  orderId: string;
  totalPrice: number;
  userName: string;
  userEmail: string;
  boardingPoint: string;
  droppingPoint: string;
  selectedSeats: string[];
  redirectUrl: string;
  backUrl: string;
  promoCode?: string;
  discountAmount?: number;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  returnSeats?: string[];
}

export interface CreateTokenResponse {
  success: boolean;
  transactionToken?: string;
  paymentUrl?: string;
  error?: string;
  resultCode?: string;
  resultExplanation?: string;
}

export const createToken = async (requestData: CreateTokenRequest): Promise<CreateTokenResponse> => {
  try {
    const companyToken = process.env.DPO_COMPANY_TOKEN || '3725588D-FFEA-4501-B489-E9ABFEA89A04';

    // Split user name
    const nameParts = requestData.userName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Always use production URLs for redirect and back in production
    const PROD_DOMAIN = 'https://reecabus.netlify.app';
    let redirectUrl = requestData.redirectUrl;
    let backUrl = requestData.backUrl;
    // Always include order_id in redirect/back URLs for payment verification
    if (process.env.NODE_ENV === 'production' || (!redirectUrl && !backUrl)) {
      redirectUrl = `${PROD_DOMAIN}/payment/success?order_id=${encodeURIComponent(requestData.orderId)}`;
      backUrl = `${PROD_DOMAIN}/payment/cancel?order_id=${encodeURIComponent(requestData.orderId)}`;
    } else {
      // fallback for dev/local
      const isLocalhost = requestData.redirectUrl.includes('localhost') || requestData.backUrl.includes('localhost');
      redirectUrl = isLocalhost ? '' : requestData.redirectUrl;
      backUrl = isLocalhost ? '' : requestData.backUrl;
    }

    // Build XML payload
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${requestData.totalPrice.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>BWP</PaymentCurrency>
    <CompanyRef>${requestData.orderId}</CompanyRef>
    <RedirectURL>${redirectUrl}</RedirectURL>
    <BackURL>${backUrl}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>15</PTL>
    <customerFirstName>${firstName}</customerFirstName>
    <customerLastName>${lastName}</customerLastName>
    <customerEmail>${requestData.userEmail}</customerEmail>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>104344</ServiceType>
      <ServiceDescription>Bus ticket booking</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0].replace(/-/g, '/')} 07:00</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    // Send to DPO
    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      timeout: 20000
    });

    // Parse XML response
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true, trim: true });
    const result = await parser.parseStringPromise(response.data);
    const api3g = result.API3G || result.api3g;

    if (api3g && api3g.Result === '000' && api3g.TransToken) {
      return {
        success: true,
        transactionToken: api3g.TransToken,
        paymentUrl: `https://secure.3gdirectpay.com/dpopayment.php?ID=${api3g.TransToken}`,
        resultCode: api3g.Result,
        resultExplanation: api3g.ResultExplanation
      };
    } else {
      return {
        success: false,
        error: api3g?.ResultExplanation || 'Failed to create payment token',
        resultCode: api3g?.Result
      };
    }
  } catch (error: any) {
    console.error('[DPO-SERVICE] Error:', error.message);
    return {
      success: false,
      error: error.message || 'Payment gateway error'
    };
  }
};