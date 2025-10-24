import { Html, Head, Preview, Body, Container, Section, Text, Link } from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({ userName, resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your REECA TRAVEL password</Preview>
    <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', color: '#374151' }}>
      <Container style={{ maxWidth: 600, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <Section style={{ textAlign: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', margin: 0 }}>REECA TRAVEL</Text>
        </Section>
        <Section>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669', margin: '8px 0' }}>Password Reset Request</Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}>
            {userName ? `Hello ${userName},` : 'Hello,'}
          </Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}>
            We received a request to reset your password for your REECA TRAVEL account. If you did not request this, you can safely ignore this email.
          </Text>
          <Text style={{ fontSize: 16, margin: '8px 0' }}>
            To reset your password, click the link below:
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Link href={resetUrl} style={{
              display: 'inline-block',
              backgroundColor: '#009393',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 6,
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: 16
            }}>Reset Password</Link>
          </Section>
          <Text style={{ fontSize: 14, color: '#6b7280', margin: '16px 0' }}>
            If the button above does not work, copy and paste this link into your browser:<br />
            <span style={{ wordBreak: 'break-all' }}>{resetUrl}</span>
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', margin: '16px 0' }}>
            This link will expire in 1 hour for your security.
          </Text>
        </Section>
        <Section style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 16, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
          <Text>For support, contact us at +26777655348 or tickets@reecatravel.co.bw</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;
