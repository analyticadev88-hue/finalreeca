import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InquiryNotificationEmailProps {
  companyName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  passengers: number;
  date: string;
  time: string;
  origin: string;
  destination: string;
  specialRequests?: string;
  returnDate?: string;
}

export const InquiryNotificationEmail = ({
  companyName,
  contactPerson,
  email,
  phone,
  passengers,
  date,
  time,
  origin,
  destination,
  specialRequests,
  returnDate,
}: InquiryNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New Inquiry from {contactPerson}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Charter/Bulk Inquiry</Heading>
        <Text style={text}>
            You have received a new inquiry from the website. Here are the details:
        </Text>
        <Section style={section}>
          <Text style={label}>Contact Person:</Text>
          <Text style={value}>{contactPerson} {companyName ? `(${companyName})` : ''}</Text>
          
          <Text style={label}>Email:</Text>
          <Text style={value}>{email}</Text>

          <Text style={label}>Phone:</Text>
          <Text style={value}>{phone}</Text>
          
          <Hr style={hr} />

          <Text style={label}>Trip:</Text>
          <Text style={value}>{origin} → {destination}</Text>
          
          <Text style={label}>Date & Time:</Text>
          <Text style={value}>{date} at {time}</Text>

          {returnDate && (
              <>
                <Text style={label}>Return Date:</Text>
                <Text style={value}>{returnDate}</Text>
              </>
          )}

          <Text style={label}>Passengers:</Text>
          <Text style={value}>{passengers}</Text>

          {specialRequests && (
              <>
                <Text style={label}>Special Requests:</Text>
                <Text style={value}>{specialRequests}</Text>
              </>
          )}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This inquiry is currently marked as PENDING in the admin dashboard.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InquiryNotificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const section = {
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
  padding: "0 48px",
};

const label = {
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  color: "#8898aa",
  margin: "10px 0 0",
};

const value = {
  fontSize: "16px",
  color: "#333",
  margin: "0 0 10px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "20px",
};
