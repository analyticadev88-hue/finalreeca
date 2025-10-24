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

interface ReservationLinkEmailProps {
  customerName?: string;
  seats: string;
  link: string;
  expiresAt: string;
  tripOrigin?: string;
  tripDestination?: string;
  tripDate?: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) || "";

export const ReservationLinkEmail = ({
  customerName = '',
  seats,
  link,
  expiresAt,
  tripOrigin,
  tripDestination,
  tripDate,
}: ReservationLinkEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Your reserved seats are waiting — complete your booking</Preview>
      <Container style={container}>
        <Img
          src={baseUrl ? `${baseUrl}/images/reeca-travel-logo.png` : '/images/reeca-travel-logo.png'}
          width="170"
          height="50"
          alt="Reeca Travel logo"
          style={logo}
        />
        <Text style={paragraph}>Hello {customerName || 'Customer'},</Text>
        <Text style={paragraph}>
          You have reserved seat(s) {seats} for {tripOrigin} → {tripDestination} on {tripDate}.
        </Text>
        <Text style={paragraph}>
          To complete your booking and download your ticket, please click the button below. This link expires on {expiresAt}.
        </Text>
        <Section style={{ marginTop: 8 }}>
          <Button style={button} href={link}>
            Complete Booking
          </Button>
        </Section>
        <Text style={paragraph}>
          If you did not make this reservation, you can ignore this email and the reservation will expire automatically.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>For support contact tickets@reecatravel.co.bw</Text>
      </Container>
    </Body>
  </Html>
);

export default ReservationLinkEmail;

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

const button = {
  backgroundColor: 'rgb(0,153,153)',
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
