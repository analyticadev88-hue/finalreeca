import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: '#e5e7eb',
    paddingBottom: 16,
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  ticketInfo: {
    textAlign: 'right',
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  ticketRef: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  tripType: {
    fontSize: 12,
    color: '#374151',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tripDetails: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tripDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tripDetailsGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tripDetailsColumn: {
    flex: 1,
  },
  tripDetailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tripDetailsLabel: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: 'bold',
    width: 70,
  },
  tripDetailsValue: {
    fontSize: 9,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  passengerTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'left',
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    color: '#374151',
    padding: 4,
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9,
  },
  summaryLabel: {
    color: '#6b7280',
    width: 100,
  },
  summaryValue: {
    color: '#1f2937',
    fontWeight: 'bold',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  notesList: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 12,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  bankingSection: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  bankingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  bankingDetails: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
  },
});

const formatDate = (dateInput: Date | string | undefined, formatStr: string) => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    weekday: formatStr.includes('EEEE') ? 'long' : undefined,
    month: formatStr.includes('MMMM') ? 'long' : formatStr.includes('MMM') ? 'short' : undefined,
    day: formatStr.includes('dd') ? '2-digit' : undefined,
    year: formatStr.includes('yyyy') ? 'numeric' : undefined,
  });
};

const renderTripSection = (trip: any, label: string, bookingStatus: string) => {
  if (!trip) return null;

  const sortedPassengers = [...trip.passengers].sort((a: any, b: any) => {
    const numA = parseInt(a.seat.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.seat.match(/\d+/)?.[0] || '0');
    if (numA !== numB) return numA - numB;
    return a.seat.localeCompare(b.seat);
  });

  const sortedSeats = [...trip.seats].sort((a: string, b: string) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  return (
    <View style={styles.section} key={label}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{label} Trip Details</Text>
      </View>
      <View style={styles.tripDetails}>
        <Text style={styles.tripDetailsTitle}>BUS TICKET - {trip.route}</Text>
        <View style={styles.tripDetailsGrid}>
          <View style={styles.tripDetailsColumn}>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Date:</Text>
              <Text style={styles.tripDetailsValue}>{formatDate(trip.date, 'EEEE, MMMM dd, yyyy')}</Text>
            </View>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Time:</Text>
              <Text style={styles.tripDetailsValue}>{trip.time}</Text>
            </View>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Bus:</Text>
              <Text style={styles.tripDetailsValue}>{trip.bus}</Text>
            </View>
          </View>
          <View style={styles.tripDetailsColumn}>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Boarding:</Text>
              <Text style={styles.tripDetailsValue}>{trip.boardingPoint?.toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Dropping:</Text>
              <Text style={styles.tripDetailsValue}>{trip.droppingPoint?.toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.tripDetailsRow}>
              <Text style={styles.tripDetailsLabel}>Seats:</Text>
              <Text style={styles.tripDetailsValue}>{sortedSeats.join(', ')}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.passengerTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>#</Text>
          <Text style={styles.tableHeaderCell}>Name</Text>
          <Text style={styles.tableHeaderCell}>Seat</Text>
          <Text style={styles.tableHeaderCell}>Title</Text>
          <Text style={styles.tableHeaderCell}>Type</Text>
          <Text style={styles.tableHeaderCell}>Infant</Text>
          <Text style={styles.tableHeaderCell}>Passport</Text>
        </View>
        {sortedPassengers.length > 0 ? (
          sortedPassengers.map((passenger: any, idx: number) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{idx + 1}</Text>
              <Text style={styles.tableCell}>{passenger.name}</Text>
              <Text style={[styles.tableCell, styles.tableCellBold]}>{passenger.seat}</Text>
              <Text style={styles.tableCell}>{passenger.title || 'Mr'}</Text>
              <Text style={styles.tableCell}>{passenger.type === 'child' ? 'Child' : 'Adult'}</Text>
              <Text style={styles.tableCell}>
                {passenger.hasInfant ? (
                  <>
                    <Text style={{ fontSize: 7 }}>
                      <Text>Infant: {passenger.infantName || 'N/A'}</Text>
                      {'\n'}
                      <Text>DOB: {passenger.infantBirthdate || 'N/A'}</Text>
                      {'\n'}
                      <Text>Passport: {passenger.infantPassportNumber || 'N/A'}</Text>
                    </Text>
                  </>
                ) : (
                  'No'
                )}
              </Text>
              <Text style={styles.tableCell}>{passenger.passportNumber || '-'}</Text>
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { textAlign: 'center' }]}>
              No passenger data available
            </Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
        <Text style={[styles.summaryRow, { marginRight: 16 }]}>
          <Text style={styles.summaryLabel}>Passengers:</Text>
          <Text style={styles.summaryValue}>{sortedPassengers.length}</Text>
        </Text>
        <Text style={[styles.summaryRow, { marginRight: 16 }]}>
          <Text style={styles.summaryLabel}>Seats:</Text>
          <Text style={styles.summaryValue}>{sortedSeats.join(', ')}</Text>
        </Text>
        <Text style={[styles.summaryRow, { marginRight: 16 }]}>
          <Text style={styles.summaryLabel}>Status:</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{bookingStatus}</Text>
        </Text>
        <Text style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date Issued:</Text>
          <Text style={styles.summaryValue}>{formatDate(new Date(), 'dd MMM yyyy')}</Text>
        </Text>
      </View>
    </View>
  );
};

export const TicketPdf = ({ booking, departureTrip, returnTrip, qrBase64 }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image style={styles.logo} src="https://reecabus.netlify.app/images/reeca-travel-logo.png" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1f2937' }}>REECA TRAVEL</Text>
            <Text style={styles.companyInfo}>
              GABORONE CBD{'\n'}
              MOGOBE PLAZA{'\n'}
              GABORONE South-East{'\n'}
              Botswana{'\n'}
              +26773061124{'\n'}
              tickets@reecatravel.co.bw{'\n'}
              www.reecabus.co.bw
            </Text>
          </View>
        </View>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle}>BUS TICKET</Text>
          <Text style={styles.ticketRef}>#{booking.orderId}</Text>
          <Text style={styles.tripType}>{returnTrip ? 'ROUNDTRIP' : 'DEPARTURE TRIP'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 2 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Passenger Manifest</Text>
          {renderTripSection(departureTrip, 'Departure', booking.bookingStatus)}
          {returnTrip && renderTripSection(returnTrip, 'Return', booking.bookingStatus)}
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>{booking.paymentMode}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Status:</Text>
              <Text style={[styles.summaryValue, { color: booking.paymentStatus === 'paid' ? '#059669' : '#dc2626' }]}>
                {booking.paymentStatus}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Booking Status:</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{booking.bookingStatus}</Text>
            </View>
          </View>
        </View>
        
        {/* Banking Details Section - Updated to match styling */}
        <View style={styles.bankingSection}>
          <Text style={styles.bankingTitle}>Banking Details</Text>
          <Text style={styles.bankingDetails}>
            <Text style={{ fontWeight: 'bold' }}>Bank:</Text> Stanbic Bank{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Account Name:</Text> AFRICAN TASTES (pty)ltd T/a REECA TRAVEL{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Account Number:</Text> 9060004001996{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Branch:</Text> Airport Junction
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cardholder & Emergency Contact</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Name:</Text>
              <Text style={styles.summaryValue}>{booking.userName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email:</Text>
              <Text style={styles.summaryValue}>{booking.userEmail}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mobile:</Text>
              <Text style={styles.summaryValue}>{booking.userPhone || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ID Type:</Text>
              <Text style={styles.summaryValue}>Passport</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Emergency Name:</Text>
              <Text style={styles.summaryValue}>-</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Emergency Phone:</Text>
              <Text style={styles.summaryValue}>-</Text>
            </View>
          </View>
        </View>
      </View>
      {booking.addons && booking.addons.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
          </View>
          <View>
            {booking.addons.map((addon: any, idx: number) => (
              <Text key={idx} style={{ fontSize: 9, marginBottom: 2 }}>
                • {addon.name} {addon.details ? `- ${addon.details}` : ''} {addon.price ? ` (${addon.price})` : ''}
              </Text>
            ))}
          </View>
        </View>
      )}
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Important Notes</Text>
            <Text style={styles.notesList}>
              • Please arrive at the boarding point 15 minutes before departure time{'\n'}
              • Valid Passport required for boarding{'\n'}
              • No refunds for no-shows{'\n'}
              • Baggage allowance: 20kg per passenger{'\n'}
              • Present this ticket (digital or printed) at boarding
            </Text>
          </View>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesList}>
              Ticket is valid only for the specified date, time, and route. Changes subject to availability and additional charges may apply.
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={styles.qrSection}>
            <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
              <Text style={styles.sectionTitle}>Booking QR Code</Text>
            </View>
            <View style={styles.qrContainer}>
              {qrBase64 && <Image style={styles.qrImage} src={qrBase64} />}
            </View>
            <Text style={{ fontSize: 8, color: '#6b7280' }}>Scan this QR code for quick verification</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text>Thank you for choosing REECA TRAVEL for your journey!</Text>
        <Text>For support, contact us at +26777655348 or tickets@reecatravel.co.bw</Text>
      </View>
    </Page>
  </Document>
);

export default TicketPdf;