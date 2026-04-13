import { Html, Head, Preview, Body, Container, Section, Text, Img } from '@react-email/components';
import * as React from 'react';

interface TicketEmailProps {
  userName: string;
  orderId: string;
  route: string;
  date: string;
  time: string;
  seats: string;
  totalPrice: string;
}

export const TicketEmail = ({ userName, orderId, route, date, time, seats, totalPrice }: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>Your REECA TRAVEL Ticket - Ref #{orderId}</Preview>
    <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', color: '#374151' }}>
      <Container style={{ maxWidth: 600, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <Section style={{ textAlign: 'center', marginBottom: 24 }}>
          <Img src="https://reecabus.co.bw/images/reeca-travel-logo.png" width="120" height="64" alt="REECA TRAVEL Logo" style={{ objectFit: 'contain', marginBottom: 8 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', margin: 0 }}>REECA TRAVEL</Text>
        </Section>
        <Section>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669', margin: '8px 0' }}>Booking Reference: {orderId}</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}><strong>Route:</strong> {route}</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}><strong>Date:</strong> {date}</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}><strong>Time:</strong> {time}</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}><strong>Seats:</strong> {seats}</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}><strong>Total Paid:</strong> BWP {totalPrice}</Text>
        </Section>
        <Section style={{ marginTop: 24 }}>
          <Text>Dear {userName},</Text>
          <Text>Thank you for booking with REECA TRAVEL! Please find your detailed ticket attached as a PDF.</Text>
          <Text>Safe travels!</Text>
        </Section>
        <Section style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 16, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
          <Text>For support, contact us at +26777655348 or tickets@reecatravel.co.bw</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TicketEmail;
