// src/app/api/payment/verify/route.ts
import { NextResponse } from 'next/server'
import * as xml2js from 'xml2js'

const DPO_COMPANY_TOKEN = "3725588D-FFEA-4501-B489-E9ABFEA89A04"

interface VerifyXMLParseResult {
    API3G: {
        Result: string[];
        ResultExplanation: string[];
        CustomerName?: string[];
        CustomerCredit?: string[];
        TransactionApproval?: string[];
        TransactionCurrency?: string[];
        TransactionAmount?: string[];
        FraudAlert?: string[];
        FraudExplnation?: string[];
        TransactionNetAmount?: string[];
        TransactionSettlementDate?: string[];
        CustomerPhone?: string[];
        CustomerCountry?: string[];
        CustomerAddress?: string[];
        CustomerCity?: string[];
        AccRef?: string[];
    }
}

const parseXML = async (xml: string) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err: Error | null, result: VerifyXMLParseResult) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionToken, companyRef } = body

    if (!transactionToken && !companyRef) {
      return NextResponse.json(
        { error: 'Transaction token or company reference is required' },
        { status: 400 }
      );
    }

    // Create XML request for verification
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  ${transactionToken ? `<TransactionToken>${transactionToken}</TransactionToken>` : ''}
  ${companyRef ? `<CompanyRef>${companyRef}</CompanyRef>` : ''}
  <VerifyTransaction>1</VerifyTransaction>
</API3G>`;

    console.log('Sending verification XML to DPO:', xmlData);

    const response = await fetch('https://secure.3gdirectpay.com/API/v6/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlData,
    });

    if (!response.ok) {
      throw new Error(`DPO API HTTP error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('DPO Verification Response:', responseText);
    
    const parsedResponse = await parseXML(responseText) as VerifyXMLParseResult;

    const result = parsedResponse.API3G.Result[0];
    const resultExplanation = parsedResponse.API3G.ResultExplanation[0];

    // Check if payment was successful
    const isSuccess = result === '000'; // Transaction Paid
    const isPending = result === '001' || result === '003' || result === '005' || result === '007'; // Various pending states

    if (isSuccess) {
      // Payment successful
      const transactionDetails = {
        customerName: parsedResponse.API3G.CustomerName?.[0],
        amount: parsedResponse.API3G.TransactionAmount?.[0],
        currency: parsedResponse.API3G.TransactionCurrency?.[0],
        approval: parsedResponse.API3G.TransactionApproval?.[0],
        reference: companyRef || transactionToken,
        netAmount: parsedResponse.API3G.TransactionNetAmount?.[0],
        settlementDate: parsedResponse.API3G.TransactionSettlementDate?.[0],
        fraudAlert: parsedResponse.API3G.FraudAlert?.[0],
      };

      // Here you would typically save the successful payment to your database
      console.log('Payment successful:', transactionDetails);

      return NextResponse.json({
        success: true,
        message: 'Payment completed successfully',
        transactionDetails,
        status: 'paid'
      });

    } else if (isPending) {
      // Payment is pending
      return NextResponse.json({
        success: false,
        message: `Payment is pending: ${resultExplanation}`,
        status: 'pending',
        resultCode: result
      });

    } else {
      // Payment failed or other error
      return NextResponse.json({
        success: false,
        message: `Payment failed: ${resultExplanation}`,
        status: 'failed',
        resultCode: result
      });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed',
        status: 'error'
      },
      { status: 500 }
    );
  }
}