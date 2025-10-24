'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast, useToast } from '@/hooks/use-toast';

const colors = { primary: '#009393' };

export default function ReservationsDashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [generatePrepaid, setGeneratePrepaid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast: showToast } = useToast();

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
      showToast({ title: 'Error', description: 'Failed to fetch reservations' });
    } finally { setLoading(false); }
  }

  async function handleGenerate(reservation: any, prepaid = false) {
    setSelectedReservation(reservation);
    setEmail(reservation.reservedContactEmail || '');
    setGeneratePrepaid(prepaid);
    setIsGenerateOpen(true);
  }

  async function sendGenerate() {
    if (!selectedReservation) return;
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/reservations/${selectedReservation.id}/generate-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactEmail: email, paid: generatePrepaid, createdBy: null })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Generate link failed', data);
        showToast({ title: 'Error', description: data?.message || data?.error || 'Failed to generate link' });
        return;
      }
      setIsGenerateOpen(false);
      const desc = `Expires ${format(new Date(data.expiresAt), 'PPpp')}` + (data?.providerMessage ? ` (${data.providerMessage})` : '');
      showToast({ title: data?.emailSent ? 'Link generated & emailed' : 'Link generated', description: desc });
      if (!data?.emailSent && data?.emailError) {
        showToast({ title: 'Email error', description: data.emailError });
      }
    } catch (err) {
      console.error(err);
      showToast({ title: 'Error', description: 'Failed to generate link' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reservations Dashboard</h1>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Liaison</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Reserved At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.reservedClientName}</TableCell>
                <TableCell>{r.reservedCompany}</TableCell>
                <TableCell>{r.reservedLiaisonPerson}</TableCell>
                <TableCell>{r.reservedContactPhone || r.reservedContactEmail}</TableCell>
                <TableCell>{r.reservedSeatsCount}</TableCell>
                <TableCell>{r.trip?.routeName} {r.trip?.departureDate && `- ${format(new Date(r.trip.departureDate), 'yyyy-MM-dd')}`}</TableCell>
                <TableCell>{r.reservationDate && format(new Date(r.reservationDate), 'PPpp')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button style={{ backgroundColor: colors.primary }} onClick={() => handleGenerate(r, false)}>Generate Seating Link</Button>
                    <Button onClick={() => window.location.href = `/admin/reservations/${r.id}/passengerdetails`}>Add Passenger Details</Button>
                    <Button onClick={() => handleGenerate(r, true)}>Generate Seat Link (Paid)</Button>
                    <Button variant="destructive" onClick={async () => {
                      if (!confirm('Cancel this reservation?')) return;
                      const res = await fetch(`/api/reservations/${r.id}/cancel`, { method: 'POST' });
                      if (res.ok) { showToast({ title: 'Reservation cancelled' }); fetchList(); }
                      else { showToast({ title: 'Error', description: 'Failed to cancel' }); }
                    }}>Cancel</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={() => setIsGenerateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Booking Link</DialogTitle>
            <DialogDescription>Enter client email to send booking link for reserved seats.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
              <Button style={{ backgroundColor: colors.primary }} onClick={sendGenerate} disabled={isGenerating}>
                {isGenerating ? 'Sending...' : 'Generate & Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
