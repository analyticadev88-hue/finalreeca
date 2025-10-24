"use client";
import React, { useState } from 'react';
import MaintenanceBlockModal from './MaintenanceBlockModal';

export default function MaintenanceQuickAction() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-[#ef4444] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#dc2626]">
        🛠️ Block Bus for Maintenance
      </button>
      <MaintenanceBlockModal isOpen={open} onClose={() => setOpen(false)} onBlocked={() => {/* refresh if needed */}} />
    </>
  );
}
