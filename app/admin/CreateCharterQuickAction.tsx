"use client";
import React, { useState } from "react";
import CreateCharterModal from "./CreateCharterModal";

export default function CreateCharterQuickAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-[#009393] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#007575]">
        Create Charter Booking
      </button>
      <CreateCharterModal isOpen={open} onClose={() => setOpen(false)} onCreated={() => {/* optional refresh */}} />
    </>
  );
}
