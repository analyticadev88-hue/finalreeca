// app/admin/maintenance/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, addDays } from 'date-fns';
import Link from 'next/link';

interface MaintenanceBlock {
  id: string;
  buses: string[];
  startDate: string;
  durationDays: number;
  affectedRoutes: string[];
  createdAt: string;
  allDates: string[];
}

interface UnblockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBlocks: MaintenanceBlock[];
  onUnblock: (selectedDates: string[], blockIds: string[]) => Promise<void>;
}

function UnblockModal({ isOpen, onClose, selectedBlocks, onUnblock }: UnblockModalProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all unique dates from selected blocks
  const allDates = selectedBlocks.flatMap(block => block.allDates);
  const uniqueDates = Array.from(new Set(allDates)).sort();

  const toggleDate = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const selectAllDates = () => {
    setSelectedDates(uniqueDates);
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  const handleUnblock = async () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date to unblock');
      return;
    }

    setIsSubmitting(true);
    try {
      const blockIds = selectedBlocks.map(block => block.id);
      await onUnblock(selectedDates, blockIds);
      onClose();
      setSelectedDates([]);
    } catch (error) {
      console.error('Failed to unblock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Unblock Dates</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select specific dates to unblock from {selectedBlocks.length} selected maintenance block(s)
          </p>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium">Selected Dates ({selectedDates.length})</h4>
              <p className="text-sm text-gray-600">
                Choose which dates to unblock
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllDates}
                className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm border border-gray-600 text-gray-600 rounded hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded">
            {uniqueDates.map(date => (
              <label key={date} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDates.includes(date)}
                  onChange={() => toggleDate(date)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{format(parseISO(date), 'MMM dd, yyyy')}</span>
              </label>
            ))}
          </div>

          {selectedBlocks.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h5 className="font-medium text-yellow-800 text-sm">Affected Maintenance Blocks:</h5>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                {selectedBlocks.map(block => (
                  <li key={block.id}>
                    {block.buses.join(', ')} - {format(parseISO(block.startDate), 'MMM dd')} (+{block.durationDays} days)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleUnblock}
            disabled={selectedDates.length === 0 || isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Unblocking...' : `Unblock ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceManagementPage() {
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlocks, setSelectedBlocks] = useState<MaintenanceBlock[]>([]);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'unblock' | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const res = await fetch('/api/maintenance/blocks');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks || []);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (selectedDates: string[], blockIds: string[]) => {
    try {
      const res = await fetch('/api/maintenance/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dates: selectedDates,
          blockIds 
        })
      });

      if (res.ok) {
        await fetchBlocks();
        setSelectedBlocks([]);
        alert(`Successfully unblocked ${selectedDates.length} date(s)`);
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to unblock');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unblock dates');
      throw error;
    }
  };

  const handleQuickUnblock = async (blockId: string) => {
    if (!confirm('Are you sure you want to unblock this entire maintenance period?')) {
      return;
    }

    try {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;

      const res = await fetch('/api/maintenance/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockIds: [blockId],
          dates: block.allDates
        })
      });

      if (res.ok) {
        await fetchBlocks();
        alert('Successfully unblocked maintenance period');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to unblock');
      }
    } catch (error) {
      alert('Failed to unblock maintenance period');
    }
  };

  const toggleBlockSelection = (block: MaintenanceBlock) => {
    setSelectedBlocks(prev => 
      prev.find(b => b.id === block.id)
        ? prev.filter(b => b.id !== block.id)
        : [...prev, block]
    );
  };

  const selectAllBlocks = () => {
    setSelectedBlocks(blocks.length === selectedBlocks.length ? [] : [...blocks]);
  };

  if (loading) return <div className="p-6">Loading maintenance blocks...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🛠️ Maintenance Block Management</h1>
          <p className="text-gray-600">Manage bus maintenance blocks and unblock dates as needed</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/maintenance/calendar"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            📅 Calendar View
          </Link>
          {selectedBlocks.length > 0 && (
            <button
              onClick={() => setShowUnblockModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Unblock Selected ({selectedBlocks.length})
            </button>
          )}
        </div>
      </div>

      {/* Selection Header */}
      {blocks.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedBlocks.length === blocks.length && blocks.length > 0}
              onChange={selectAllBlocks}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">
              Select All ({selectedBlocks.length} of {blocks.length} selected)
            </span>
          </label>
          
          {selectedBlocks.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedBlocks.length} block(s) selected •{' '}
              {selectedBlocks.flatMap(b => b.allDates).length} total date(s)
            </div>
          )}
        </div>
      )}

      {/* Blocks Grid */}
      <div className="grid gap-4">
        {blocks.map((block) => (
          <div key={block.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedBlocks.some(b => b.id === block.id)}
                onChange={() => toggleBlockSelection(block)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Buses: {block.buses.join(', ')}
                    </h3>
                    <p className="text-gray-600">
                      Start: {format(parseISO(block.startDate), 'MMM dd, yyyy')} 
                      • Duration: {block.durationDays} day{block.durationDays > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Blocked on: {format(parseISO(block.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUnblockModal(true)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Select Dates
                    </button>
                    <button
                      onClick={() => handleQuickUnblock(block.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Unblock All
                    </button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h4 className="font-medium text-sm text-gray-700">Affected Routes:</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                    {block.affectedRoutes.map((route, index) => (
                      <li key={index}>{route}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3">
                  <h4 className="font-medium text-sm text-gray-700">Blocked Dates:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {block.allDates.map((date, index) => (
                      <span
                        key={date}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                      >
                        {format(parseISO(date), 'MMM dd')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-lg font-medium mb-2">No Active Maintenance Blocks</h3>
            <p className="text-gray-600">There are currently no buses blocked for maintenance.</p>
          </div>
        )}
      </div>

      {/* Unblock Modal */}
      <UnblockModal
        isOpen={showUnblockModal}
        onClose={() => setShowUnblockModal(false)}
        selectedBlocks={selectedBlocks}
        onUnblock={handleUnblock}
      />
    </div>
  );
}