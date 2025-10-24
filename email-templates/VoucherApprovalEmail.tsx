import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VoucherApprovalEmailProps {
  adminName?: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  seats: string;
  approveLink: string;
  expiresAt: string;
}

// Build base URL for absolute asset links in emails. Use NEXT_PUBLIC_APP_URL if set,
// otherwise leave empty (email clients will resolve relative paths relative to the sending domain).
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) || "";

export const VoucherApprovalEmail = ({
  adminName = 'Tshosa',
  bookingRef,
  customerName,
  customerEmail,
  seats,
  approveLink,
  expiresAt,
}: VoucherApprovalEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Voucher approval requested — {bookingRef}</Preview>
      <Container style={container}>
        <Img
          // Prefer a simple absolute/relative path that matches how other pages reference the image in the public/ folder.
          // If NEXT_PUBLIC_APP_URL is set we keep the same behavior, otherwise the relative path will be used by the mailer.
          src={baseUrl ? `${baseUrl}/images/reeca-travel-logo.png` : '/images/reeca-travel-logo.png'}
          width="170"
          height="50"
          alt="Reeca Travel logo"
          style={logo}
        />
        <Text style={paragraph}>GoodDay {adminName},</Text>
        <Text style={paragraph}>
          A consultant has requested a Free Voucher booking that needs your approval.
        </Text>

        <Section style={{ marginTop: 8 }}>
          <Text style={paragraph}><strong>Booking ref:</strong> {bookingRef}</Text>
          <Text style={paragraph}><strong>Customer:</strong> {customerName} &lt;{customerEmail}&gt;</Text>
          <Text style={paragraph}><strong>Seats:</strong> {seats}</Text>
          <Text style={paragraph}><strong>Expires at:</strong> {expiresAt}</Text>
        </Section>

        <Section style={btnContainer}>
          <Button style={button} href={approveLink}>
            Approve Voucher
          </Button>
        </Section>

        <Text style={paragraph}>
          If you did not expect this request, you can ignore this email and the request will expire automatically.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>For support contact tickets@reecatravel.co.bw</Text>
      </Container>
    </Body>
  </Html>
);

VoucherApprovalEmail.PreviewProps = {
  bookingRef: 'RT000000',
  customerName: 'Customer',
  customerEmail: 'customer@example.com',
  seats: '1A',
  approveLink: '#',
  expiresAt: new Date().toISOString(),
};

export default VoucherApprovalEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: 'rgb(255,215,0)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 18px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};
