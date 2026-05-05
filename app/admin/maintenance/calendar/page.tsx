// app/admin/maintenance/calendar/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isAfter, isBefore, getDay } from 'date-fns';
import MaintenanceBlockModal from '../../MaintenanceBlockModal';
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
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set()); // Multi-select dates
  const [lastSelectedDate, setLastSelectedDate] = useState<string | null>(null); // For range selection
  const [viewingDate, setViewingDate] = useState<Date | null>(null); // For detail modal
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

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

  const getDateRange = (startDateStr: string, endDateStr: string): string[] => {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    // Determine which date is earlier
    const earlier = isBefore(startDate, endDate) ? startDate : endDate;
    const later = isAfter(startDate, endDate) ? startDate : endDate;

    // Get all dates in the range
    const datesInRange = eachDayOfInterval({ start: earlier, end: later });
    return datesInRange.map(date => format(date, 'yyyy-MM-dd'));
  };

  const toggleDateSelection = (date: Date, e: React.MouseEvent) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    if (e.shiftKey) {
      // Shift+Click: Select range from last selected to current
      e.stopPropagation();

      if (lastSelectedDate) {
        // We have an anchor, select the range
        const rangeDates = getDateRange(lastSelectedDate, dateStr);
        setSelectedDates(prev => {
          const newSet = new Set(prev);
          rangeDates.forEach(d => newSet.add(d));
          return newSet;
        });
      } else {
        // No anchor yet, just select this date and set it as anchor
        setSelectedDates(prev => {
          const newSet = new Set(prev);
          newSet.add(dateStr);
          return newSet;
        });
        setLastSelectedDate(dateStr);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+Click: Toggle individual date
      e.stopPropagation();
      setSelectedDates(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dateStr)) {
          newSet.delete(dateStr);
        } else {
          newSet.add(dateStr);
        }
        return newSet;
      });
      setLastSelectedDate(dateStr); // Update anchor for range selection
    } else {
      // Single click without modifier - open detail modal
      setViewingDate(date);
    }
  };

  const handleUnblockDate = async (date: string, blockId?: string) => {
    const dateStr = format(parseISO(date), 'MMM dd, yyyy');

    if (blockId) {
      if (!confirm(`Unblock this maintenance block on ${dateStr}?`)) return;
    } else {
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
        setViewingDate(null);
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

  const handleBulkUnblockSelectedDates = async () => {
    if (selectedDates.size === 0) {
      alert('Please select dates to unblock');
      return;
    }

    if (!confirm(`Unblock ALL maintenance on ${selectedDates.size} selected date(s)?`)) return;

    try {
      const promises = Array.from(selectedDates).map(dateStr =>
        fetch('/api/maintenance/unblock-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr })
        })
      );

      await Promise.all(promises);
      await fetchBlockedDays();
      setSelectedDates(new Set());
      setLastSelectedDate(null);
      alert(`Successfully unblocked ${selectedDates.size} date(s)`);
    } catch (error) {
      alert('Failed to unblock selected dates');
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedBlocks.size === 0) {
      alert('Please select blocks to unblock');
      return;
    }

    const viewingDateObj = viewingDate;
    if (!viewingDateObj) return;

    const dateStr = format(viewingDateObj, 'yyyy-MM-dd');
    const displayDate = format(viewingDateObj, 'MMM dd, yyyy');

    if (!confirm(`Unblock ${selectedBlocks.size} selected block(s) on ${displayDate}?`)) return;

    try {
      const promises = Array.from(selectedBlocks).map(blockId =>
        fetch('/api/maintenance/unblock-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, blockId })
        })
      );

      await Promise.all(promises);
      await fetchBlockedDays();
      setViewingDate(null);
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

  const selectAllBlockedDates = () => {
    const blockedDateStrs = blockedDays.map(day => day.date);
    if (selectedDates.size === blockedDateStrs.length) {
      setSelectedDates(new Set());
      setLastSelectedDate(null);
    } else {
      setSelectedDates(new Set(blockedDateStrs));
      setLastSelectedDate(blockedDateStrs[blockedDateStrs.length - 1] || null);
    }
  };

  const clearSelection = () => {
    setSelectedDates(new Set());
    setLastSelectedDate(null);
  };

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  
  const monthDays = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });

  const startOffset = getDay(firstDayOfMonth);
  const paddingDays = Array.from({ length: startOffset });
  const endOffset = 6 - getDay(lastDayOfMonth);
  const endPaddingDays = Array.from({ length: endOffset });

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
      <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50/30">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-500 font-medium">Synchronizing calendar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="text-orange-600">📅</span> Maintenance Calendar
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage bus service schedules and downtime</p>
          <div className="flex gap-4 mt-2">
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Ctrl+Click: Select Multiple
            </p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Shift+Click: Select Range
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold active:scale-95"
          >
            <span className="text-lg">🛠️</span> Block Maintenance
          </button>
          
          <Link
            href="/admin/maintenance"
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all bg-white shadow-sm flex items-center gap-2 font-medium"
          >
            <span>📋</span> List View
          </Link>

          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Previous Month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="px-4 py-1 font-bold text-gray-800 min-w-[150px] text-center text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Next Month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedDates.size > 0 && (
        <div className="mb-6 p-4 bg-blue-600 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="font-bold text-white text-lg">
              {selectedDates.size} date(s) selected
            </span>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={selectAllBlockedDates}
              className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20 font-medium"
            >
              {selectedDates.size === blockedDays.length ? 'Deselect All' : 'Select All Blocked'}
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20 font-medium"
            >
              Clear selection
            </button>
            <button
              onClick={handleBulkUnblockSelectedDates}
              className="px-4 py-2 text-sm bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold shadow-sm"
            >
              Unblock Selected Dates
            </button>
          </div>
        </div>
      )}

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-4 mb-4">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest py-2">
            {day.substring(0, 3)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {paddingDays.map((_, i) => (
          <div 
            key={`pad-start-${i}`} 
            className="min-h-[140px] p-2 bg-gray-50/30 border border-gray-100 rounded-2xl opacity-20"
          />
        ))}
        {monthDays.map(day => {
          const blockedDay = getBlockedDay(day);
          const isBlocked = !!blockedDay;
          const isToday = isSameDay(day, new Date());
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDates.has(dateStr);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] p-4 border rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                isBlocked
                  ? 'bg-gradient-to-br from-orange-50 to-white border-orange-200 hover:border-orange-400 hover:shadow-xl'
                  : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-xl'
                } ${isToday ? 'ring-2 ring-blue-500 shadow-md' : ''} ${
                  isSelected ? 'ring-2 ring-green-500 bg-green-50/30 border-green-200' : ''
                }`}
              onClick={(e) => toggleDateSelection(day, e)}
            >
              {isBlocked && (
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-orange-100 rounded-full opacity-40 group-hover:scale-110 transition-transform" />
              )}
              
              <div className="flex justify-between items-start relative z-10 mb-2">
                <span className={`text-xl font-black ${
                  isBlocked ? 'text-orange-900' : 'text-gray-900'
                  } ${isToday ? 'bg-blue-600 text-white w-9 h-9 flex items-center justify-center rounded-xl -ml-2 -mt-2 shadow-lg scale-110' : ''}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-1">
                  {isSelected && (
                    <div className="bg-green-500 text-white p-1 rounded-lg shadow-sm">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  {isBlocked && (
                    <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full shadow-sm font-black ring-2 ring-white">
                      {blockedDay.blocks.length}
                    </span>
                  )}
                </div>
              </div>

              {isBlocked && (
                <div className="mt-3 space-y-1.5 relative z-10">
                  {blockedDay.blocks.slice(0, 3).map(block => (
                    <div key={block.id} className="text-[10px] leading-tight text-orange-800 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-orange-100 truncate font-bold shadow-sm">
                      {block.buses.join(', ')}
                    </div>
                  ))}
                  {blockedDay.blocks.length > 3 && (
                    <div className="text-[10px] text-orange-500 pl-1 font-bold italic">
                      + {blockedDay.blocks.length - 3} more blocks
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {endPaddingDays.map((_, i) => (
          <div 
            key={`pad-end-${i}`} 
            className="min-h-[140px] p-2 bg-gray-50/30 border border-gray-100 rounded-2xl opacity-20"
          />
        ))}
      </div>

      {/* Detail Modal */}
      {viewingDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 leading-tight">
                    {format(viewingDate, 'MMMM dd, yyyy')}
                  </h3>
                  <p className="text-gray-500 font-medium mt-1">
                    Daily maintenance schedule and blocked units
                  </p>
                </div>
                <button 
                  onClick={() => { setViewingDate(null); setSelectedBlocks(new Set()); }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {getBlockedDay(viewingDate) ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2">
                      <span className="p-1.5 bg-orange-100 rounded-lg">🛠️</span>
                      Blocked Buses ({getBlockedDay(viewingDate)!.blocks.length})
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAllBlocks(getBlockedDay(viewingDate)!.blocks)}
                        className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {selectedBlocks.size === getBlockedDay(viewingDate)!.blocks.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {getBlockedDay(viewingDate)!.blocks.map(block => (
                      <div key={block.id} className={`border rounded-2xl p-5 transition-all ${selectedBlocks.has(block.id) ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-start gap-4">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedBlocks.has(block.id)}
                              onChange={() => toggleBlockSelection(block.id)}
                              className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xl font-black text-gray-900">{block.buses.join(', ')}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Maintenance</span>
                                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Started {format(parseISO(block.startDate), 'MMM dd')} • {block.durationDays} days
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnblockDate(format(viewingDate, 'yyyy-MM-dd'), block.id)}
                                className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors border border-green-200"
                              >
                                Unblock
                              </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Affected Service Routes</p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {block.affectedRoutes.map((route, idx) => (
                                  <li key={idx} className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                    {route}
                                  </li>
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
                <div className="py-20 text-center">
                  <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Clear for Service</h4>
                  <p className="text-gray-500 mt-1">No maintenance blocks scheduled for this date.</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-2">
                {getBlockedDay(viewingDate) && selectedBlocks.size > 0 && (
                  <button
                    onClick={handleBulkUnblock}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                  >
                    Unblock Selected ({selectedBlocks.size})
                  </button>
                )}
                {getBlockedDay(viewingDate) && (
                  <button
                    onClick={() => handleUnblockDate(format(viewingDate, 'yyyy-MM-dd'))}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                  >
                    Unblock All for Day
                  </button>
                )}
              </div>
              <button
                onClick={() => { setViewingDate(null); setSelectedBlocks(new Set()); }}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Block Modal */}
      <MaintenanceBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onBlocked={() => {
          fetchBlockedDays();
          setIsBlockModalOpen(false);
        }}
      />
    </div>
  );
}