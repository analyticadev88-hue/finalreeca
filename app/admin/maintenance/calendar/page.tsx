// app/admin/maintenance/calendar/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import Link from 'next/link';

interface MaintenanceBlock {
  id: string;
  buses: string[];
  startDate: string;
  durationDays: number;
  affectedRoutes: string[];
}

interface BlockedDay {
  date: string;
  blocks: MaintenanceBlock[];
}

// Helper function to parse ISO dates
function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export default function MaintenanceCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedDays();
  }, [currentMonth]);

  const fetchBlockedDays = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const res = await fetch(`/api/maintenance/calendar?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedDays(data.blockedDays || []);
      }
    } catch (error) {
      console.error('Failed to fetch blocked days:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (date: string, blockId?: string) => {
    const dateStr = format(parseISO(date), 'MMM dd, yyyy');
    
    if (blockId) {
      // Unblock specific block on this date
      if (!confirm(`Unblock this maintenance block on ${dateStr}?`)) return;
    } else {
      // Unblock all maintenance on this date
      if (!confirm(`Unblock ALL maintenance on ${dateStr}?`)) return;
    }

    try {
      const res = await fetch('/api/maintenance/unblock-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, blockId })
      });

      if (res.ok) {
        await fetchBlockedDays();
        setSelectedDate(null);
        setSelectedBlocks(new Set());
        alert('Successfully unblocked date');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to unblock');
      }
    } catch (error) {
      alert('Failed to unblock date');
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedBlocks.size === 0) {
      alert('Please select blocks to unblock');
      return;
    }

    const selectedDateObj = selectedDate;
    if (!selectedDateObj) return;

    const dateStr = format(selectedDateObj, 'yyyy-MM-dd');
    const displayDate = format(selectedDateObj, 'MMM dd, yyyy');

    if (!confirm(`Unblock ${selectedBlocks.size} selected block(s) on ${displayDate}?`)) return;

    try {
      // Unblock each selected block individually
      const promises = Array.from(selectedBlocks).map(blockId =>
        fetch('/api/maintenance/unblock-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, blockId })
        })
      );

      await Promise.all(promises);
      await fetchBlockedDays();
      setSelectedDate(null);
      setSelectedBlocks(new Set());
      alert(`Successfully unblocked ${selectedBlocks.size} block(s)`);
    } catch (error) {
      alert('Failed to unblock selected blocks');
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const selectAllBlocks = (blocks: MaintenanceBlock[]) => {
    if (selectedBlocks.size === blocks.length) {
      setSelectedBlocks(new Set());
    } else {
      setSelectedBlocks(new Set(blocks.map(block => block.id)));
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getBlockedDay = (date: Date) => {
    return blockedDays.find(day => 
      isSameDay(parseISO(day.date), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 Maintenance Calendar</h1>
          <p className="text-gray-600">View and manage maintenance blocks by date</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/maintenance"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            🛠️ List View
          </Link>
          <button
            onClick={() => navigateMonth('prev')}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-1 font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthDays.map(day => {
          const blockedDay = getBlockedDay(day);
          const isBlocked = !!blockedDay;
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 p-2 border rounded cursor-pointer transition-all ${
                isBlocked 
                  ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                  : 'bg-white hover:bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${
                  isBlocked ? 'text-red-700' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
                {isBlocked && (
                  <span className="text-xs bg-red-500 text-white px-1 rounded">
                    {blockedDay.blocks.length}
                  </span>
                )}
              </div>
              
              {isBlocked && (
                <div className="mt-1 space-y-1">
                  {blockedDay.blocks.slice(0, 2).map(block => (
                    <div key={block.id} className="text-xs text-red-600 truncate">
                      {block.buses[0]}
                      {block.buses.length > 1 && ` +${block.buses.length - 1}`}
                    </div>
                  ))}
                  {blockedDay.blocks.length > 2 && (
                    <div className="text-xs text-red-400">
                      +{blockedDay.blocks.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Date Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'MMMM dd, yyyy')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Maintenance blocks for this date
              </p>
            </div>
            
            {getBlockedDay(selectedDate) ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-red-700">
                    Blocked Buses ({getBlockedDay(selectedDate)!.blocks.length})
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllBlocks(getBlockedDay(selectedDate)!.blocks)}
                      className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                    >
                      {selectedBlocks.size === getBlockedDay(selectedDate)!.blocks.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedBlocks.size > 0 && (
                      <button
                        onClick={handleBulkUnblock}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Unblock Selected ({selectedBlocks.size})
                      </button>
                    )}
                    <button
                      onClick={() => handleUnblockDate(format(selectedDate, 'yyyy-MM-dd'))}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Unblock All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {getBlockedDay(selectedDate)!.blocks.map(block => (
                    <div key={block.id} className="border rounded p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedBlocks.has(block.id)}
                          onChange={() => toggleBlockSelection(block.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{block.buses.join(', ')}</p>
                              <p className="text-sm text-gray-600">
                                Start: {format(parseISO(block.startDate), 'MMM dd, yyyy')} • {block.durationDays} day{block.durationDays > 1 ? 's' : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnblockDate(format(selectedDate, 'yyyy-MM-dd'), block.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Unblock
                            </button>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Affected Routes:</p>
                            <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                              {block.affectedRoutes.map((route, idx) => (
                                <li key={idx}>{route}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No maintenance blocks for this date
              </div>
            )}
            
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedBlocks(new Set());
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}