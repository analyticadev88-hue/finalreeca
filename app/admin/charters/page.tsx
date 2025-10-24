'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const colors = { primary: '#009393' };

export default function ChartersDashboard() {
  const [charters, setCharters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharter, setSelectedCharter] = useState<any | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [generatePrepaid, setGeneratePrepaid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/charters');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCharters(data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch charters' });
    } finally { setLoading(false); }
  }

  async function handleGenerate(charter: any, prepaid = false) {
    setSelectedCharter(charter);
    setEmail(charter.reservedContactEmail || '');
    setGeneratePrepaid(prepaid);
    setIsGenerateOpen(true);
  }

  async function sendGenerate() {
    if (!selectedCharter) return;
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/charters/${selectedCharter.id}/generate-link`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactEmail: email, 
          paid: generatePrepaid, 
          createdBy: null 
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.error('Generate charter link failed', data);
        toast({ 
          title: 'Error', 
          description: data?.message || data?.error || 'Failed to generate charter link' 
        });
        return;
      }
      
      setIsGenerateOpen(false);
      const desc = `Expires ${format(new Date(data.expiresAt), 'PPpp')}` + 
                   (data?.providerMessage ? ` (${data.providerMessage})` : '');
      
      toast({ 
        title: data?.emailSent ? 'Charter link generated & emailed' : 'Charter link generated', 
        description: desc 
      });
      
      if (!data?.emailSent && data?.emailError) {
        toast({ 
          title: 'Email error', 
          description: data.emailError 
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to generate charter link' });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCancel(c: any) {
    if (!confirm('Cancel this charter and restore service?')) return;
    setIsCanceling(true);
    try {
      const res = await fetch('/api/charters/cancel', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ reservationId: c.id }) 
      });
      if (!res.ok) throw new Error('Cancel failed');
      toast({ title: 'Charter cancelled' });
      fetchList();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to cancel charter' });
    } finally { setIsCanceling(false); }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Charters Dashboard</h1>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charters.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.reservedClientName}</TableCell>
                <TableCell>{c.reservedCompany}</TableCell>
                <TableCell>
                  {c.trip?.charterDates || 
                   (c.reservationDate && format(new Date(c.reservationDate), 'PPP'))}
                </TableCell>
                <TableCell>{c.trip?.routeName}</TableCell>
                <TableCell>{c.reservedSeatsCount}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    c.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    c.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {c.status || 'active'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {/* Three link generation buttons like reservations */}
                    <Button 
                      style={{ backgroundColor: colors.primary }} 
                      onClick={() => handleGenerate(c, false)}
                      size="sm"
                    >
                      Generate Seating Link
                    </Button>
                    <Button 
                      onClick={() => handleGenerate(c, true)}
                      size="sm"
                    >
                      Generate Seat Link (Paid)
                    </Button>
                    
                    {/* Additional actions */}
                    <Button 
                      onClick={() => window.location.href = `/admin/charters/${c.id}/passengerdetails`}
                      size="sm"
                      variant="outline"
                    >
                      Add Passengers
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancel(c)} 
                      disabled={isCanceling}
                      size="sm"
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Generate Link Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={() => setIsGenerateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Charter Booking Link</DialogTitle>
            <DialogDescription>
              Enter client email to send booking link for charter seats. 
              {generatePrepaid && ' This link will be marked as pre-paid.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              type="email"
              placeholder="client@company.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsGenerateOpen(false)}>
                Cancel
              </Button>
              <Button 
                style={{ backgroundColor: colors.primary }} 
                onClick={sendGenerate} 
                disabled={isGenerating}
              >
                {isGenerating ? 'Sending...' : 'Generate & Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}