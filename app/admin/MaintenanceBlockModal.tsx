"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRoutesForBuses } from '@/lib/busRoutes';

export default function MaintenanceBlockModal({ isOpen, onClose, onBlocked }: { isOpen: boolean; onClose: () => void; onBlocked: () => void; }) {
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBuses([]);
      setDurationDays(1);
      setStartDate('');
      setError(null);
    }
  }, [isOpen]);

  const toggleBus = (bus: string) => {
    setSelectedBuses(prev => prev.includes(bus) ? prev.filter(b => b !== bus) : [...prev, bus]);
  };

  const affectedRoutes = getRoutesForBuses(selectedBuses);

  const handleBlock = async () => {
    setError(null);
    if (selectedBuses.length === 0) return setError('Select at least one bus');
    if (!startDate) return setError('Select start date');
    if (durationDays < 1 || durationDays > 30) return setError('Duration must be 1-30 days');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/maintenance/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buses: selectedBuses, startDate, durationDays })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || 'Failed to block');
      }
      onBlocked();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>🛠️ BLOCK BUS FOR MAINTENANCE</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <div className="text-sm font-medium">Select Bus to Block:</div>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={selectedBuses.includes('Morning Bus')} onChange={() => toggleBus('Morning Bus')} />
                <div className="ml-2">
                  <div className="font-medium">Morning Bus</div>
                  <div className="text-sm text-gray-600">Blocks: 07:00 Gabs→JHB & 17:00 JHB→Gabs</div>
                </div>
              </label>

              <label className="flex items-start gap-2">
                <input type="checkbox" checked={selectedBuses.includes('Afternoon Bus')} onChange={() => toggleBus('Afternoon Bus')} />
                <div className="ml-2">
                  <div className="font-medium">Afternoon Bus</div>
                  <div className="text-sm text-gray-600">Blocks: 15:00 Gabs→JHB & 08:00 JHB→Gabs</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Maintenance Duration (days)</span>
              <input type="number" min={1} max={30} value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Start Date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
            </label>
          </div>

          <div>
            <div className="text-sm font-medium">📋 AFFECTED ROUTES:</div>
            <ul className="list-disc pl-6 text-sm text-gray-700 mt-2">
              {affectedRoutes.length === 0 ? <li>None selected</li> : affectedRoutes.map(r => <li key={r}>{r}</li>)}
            </ul>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 mt-2">
            <button className="px-3 py-1 rounded border" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
            <button className="px-3 py-1 rounded bg-[#ef4444] text-white" onClick={handleBlock} disabled={isSubmitting}>{isSubmitting ? 'Blocking...' : 'BLOCK BUS & SHOW FULLY BOOKED'}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
