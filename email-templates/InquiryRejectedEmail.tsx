import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface InquiryRejectedEmailProps {
  contactPerson: string;
  companyName?: string;
  origin: string;
  destination: string;
  date: string;
  customMessage?: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) || "";

export const InquiryRejectedEmail = ({
  contactPerson,
  companyName,
  origin,
  destination,
  date,
  customMessage,
}: InquiryRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Update on your inquiry — REECA TRAVEL</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={baseUrl ? `${baseUrl}/images/reeca-travel-logo.png` : '/images/reeca-travel-logo.png'}
          width="170"
          height="50"
          alt="Reeca Travel logo"
          style={logo}
        />
        <Heading style={h1}>Inquiry Update</Heading>

        <Text style={paragraph}>Dear {contactPerson}{companyName ? ` (${companyName})` : ''},</Text>

        <Text style={paragraph}>
          Thank you for your interest in REECA TRAVEL. After careful review, we regret to inform you that we are unable to accommodate your inquiry at this time.
        </Text>

        {customMessage && (
          <Section style={messageBox}>
            <Text style={{ ...paragraph, margin: 0 }}>{customMessage}</Text>
          </Section>
        )}

        <Section style={detailsBox}>
          <Text style={detailLabel}>Journey</Text>
          <Text style={detailValue}>{origin} → {destination}</Text>

          <Text style={detailLabel}>Date</Text>
          <Text style={detailValue}>{date}</Text>
        </Section>

        <Text style={paragraph}>
          This may be due to limited fleet availability, scheduling conflicts, or route constraints. We sincerely apologize for any inconvenience this may cause.
        </Text>

        <Text style={paragraph}>
          We would love to assist you with an alternative date or route. Please reach out to us on WhatsApp at <strong>+267 7650 6348</strong> or email <strong>tickets@reecatravel.co.bw</strong> and we’ll do our best to find a suitable option.
        </Text>

        <Text style={paragraph}>Thank you for considering REECA TRAVEL.</Text>

        <Hr style={hr} />
        <Text style={footer}>
          REECA TRAVEL | Mogobe Plaza, Gaborone CBD, 4th Floor | +267 7306 1124
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InquiryRejectedEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const logo = {
  margin: '0 auto 20px',
};

const h1 = {
  color: '#b91c1c',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
};

const messageBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const detailLabel = {
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  color: '#8898aa',
  margin: '12px 0 4px',
};

const detailValue = {
  fontSize: '16px',
  color: '#333',
  margin: '0 0 8px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 0 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
};
