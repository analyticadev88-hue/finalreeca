'use client';
import { Download, ArrowLeft } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useEffect, useState, use } from "react";
import { PassengerManifest } from "@/components/passengermanifest";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAddPassengerModal } from "@/components/admin/QuickAddPassengerModal";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function ManifestPage({ params: paramsPromise, onBack }: { params: Promise<{ busId: string }>, onBack?: () => void }) {
  const params = use(paramsPromise);
  const busId = params.busId;
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchManifestData = () => {
    setLoading(true);
    fetch(`/api/bus/${busId}/bookings`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings || []);
        if (data.trip) {
            setTripData(data.trip);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching manifest:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setIsMounted(true);
    fetchManifestData();
  }, [busId]);

  if (!isMounted) return <div className="p-8"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;

  // Get trip info from first booking
  const trip = bookings[0]?.trip || {};
  const route = trip.routeOrigin && trip.routeDestination
    ? `${trip.routeOrigin} → ${trip.routeDestination}`
    : "";
  const date = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "";
  const time = trip.departureTime || "";

  // Flatten passengers and add booking info
  const currentTripPassengers = bookings.flatMap(booking =>
    booking.passengers
      .filter((p: any) => !p.isReturn)
      .map((p: any) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        boarded: p.boarded,
        agent: booking.agent?.name || "Client",
        bookingRef: booking.orderId,
        route,
        date,
        time,
        hasInfant: p.hasInfant,
        passportNumber: p.passportNumber, // <-- add this
        type: p.type, // <-- add this
        infantName: p.infantName, // <-- add this
        infantBirthdate: p.infantBirthdate, // <-- add this
        infantPassportNumber: p.infantPassportNumber, // <-- add this
        phone: p.phone || "-",
        nokName: p.nextOfKinName || "-",
        nokPhone: p.nextOfKinPhone || "-",
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      }))
  );

  // Get total seat count from trip data (default to 60 if missing)
  const totalSeats = trip.totalSeats || trip.seatCount || 60;

  // Get confirmed and paid passengers
  const confirmedPassengers = currentTripPassengers.filter(p =>
    String(p.paymentStatus || '').toLowerCase() === 'paid' &&
    String(p.bookingStatus || '').toLowerCase() === 'confirmed'
  );

  // Create full passenger list: confirmed passengers + empty rows up to totalSeats
  const paddedPassengerList = [
    ...confirmedPassengers,
    ...Array.from({ length: Math.max(0, totalSeats - confirmedPassengers.length) }, (_, i) => ({
      name: "",
      seat: String(confirmedPassengers.length + i + 1),
      title: "",
      boarded: false,
      agent: "",
      bookingRef: "",
      route,
      date,
      time,
      hasInfant: false,
      passportNumber: "",
      type: "",
      infantName: "",
      infantBirthdate: "",
      infantPassportNumber: "",
      phone: "",
      nokName: "",
      nokPhone: "",
      paymentStatus: "",
      bookingStatus: "",
    }))
  ];

  // Show all passengers who have a confirmed booking, regardless of payment status
  // (e.g., Bank Deposits or 'Swipe in Person' will show up as pending until confirmed)
  const displayedPassengers = currentTripPassengers.filter(p =>
    String(p.bookingStatus || '').toLowerCase() === 'confirmed'
  );

  // PDF Export
  const handlePdfDownload = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add watermark background
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
    
    // Add logo
    const logoUrl = "/images/plog.png";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;

    const generatePdf = () => {
      doc.addImage(img, "PNG", 20, 15, 25, 25);
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(20);
      doc.text("PASSENGER MANIFEST", 105, 25, { align: 'center' });
      
      // Trip info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Route: ${route}`, 20, 50);
      doc.text(`Date: ${date}`, 20, 58);
      doc.text(`Time: ${time}`, 20, 66);
      doc.text(`Total Passengers: ${currentTripPassengers.length}`, 20, 74);
      
      // Table
      autoTable(doc, {
        head: [["Name", "Seat", "Title", "Booking Ref", "Agent", "Infant", "Boarded"]],
        body: paddedPassengerList.map(p => [
          p.name,
          p.seat,
          p.title,
          p.bookingRef,
          p.agent,
          p.hasInfant ? "Yes" : "No",
          p.boarded ? "Boarded" : "Pending",
        ]),
        startY: 80,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 118, 110], // teal-700
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          textColor: [15, 23, 42], // slate-900
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        styles: {
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.2
        },
        margin: { top: 80 },
        didParseCell: function (data) {
          // Highlight boarded rows
          if (
            data.section === 'body' &&
            currentTripPassengers[data.row.index].boarded
          ) {
            data.cell.styles.fillColor = [220, 252, 231]; // light green (tailwind green-100)
          }
        }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 292, { align: 'center' });
      }
      
      doc.save(`manifest-${route}-${date.replace(/\s+/g, '-')}.pdf`);
    };

    if (img.complete) {
      generatePdf();
    } else {
      img.onload = generatePdf;
    }
  };

  // Excel Export
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      paddedPassengerList.map(p => ({
        Name: p.name,
        Seat: p.seat,
        Title: p.title,
        "Booking Ref": p.bookingRef,
        Agent: p.agent,
        Boarded: p.boarded ? "Yes" : "No",
        Route: p.route,
        Date: p.date,
        Time: p.time,
        "Has Infant": p.hasInfant ? "Yes" : "No", // NEW
      }))
    );
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 8 },  // Seat
      { wch: 10 }, // Title
      { wch: 15 }, // Booking Ref
      { wch: 20 }, // Agent
      { wch: 10 }, // Boarded
      { wch: 30 }, // Route
      { wch: 15 }, // Date
      { wch: 10 }, // Time
      { wch: 10 }  // Has Infant
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");
    XLSX.writeFile(workbook, `manifest-${route}-${date.replace(/\s+/g, '-')}.xlsx`);
  };

  const handlePassengerListDownload = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add watermark background
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    // Add logo (higher quality, larger size)
    const logoUrl = "/images/sticker.png";
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;

    // Parse route for From/To
    let from = "";
    let to = "";
    if (route.includes("→")) {
      [from, to] = route.split("→").map(s => s.trim());
    }

    const generatePdf = () => {
      // Place logo at top left, larger size for print clarity
      doc.addImage(img, "PNG", 15, 10, 50, 50, undefined, 'FAST');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Passenger List", 105, 25, { align: 'center' });

      // Trip info (structured)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`From: ${from}`, 15, 65);
      doc.text(`To: ${to}`, 15, 73);
      doc.text(`Date: ${date}`, 15, 81);
      doc.text(`Time: ${time}`, 15, 89);
      doc.text(`Bus Reg: ___________________________`, 15, 97);

      // Table (move down to avoid logo/trip info)
      autoTable(doc, {
        head: [["#", "Full Name", "Passport Number", "Seat", "Type", "Phone", "NOK Name", "NOK Number", "Infant"]],
        body: paddedPassengerList.map((p, idx) => [
          idx + 1,
          p.name || " ",
          p.passportNumber || " ",
          p.name ? p.seat : "", // Only show seat number if passenger name is present
          p.type || " ",
          p.phone || " ",
          p.nokName || " ",
          p.nokPhone || " ",
          p.hasInfant
            ? `Yes${p.infantName ? `, Name: ${p.infantName}` : ""}${p.infantBirthdate ? `, DOB: ${p.infantBirthdate}` : ""}${p.infantPassportNumber ? `, Passport: ${p.infantPassportNumber}` : ""}`
            : " "
        ]),
        startY: 105, // Start table below logo and trip info
        theme: 'grid',
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        }
      });

      doc.save(`passenger-list-${from}-${to}-${date.replace(/\s+/g, '-')}.pdf`);
    };

    if (img.complete) {
      generatePdf();
    } else {
      img.onload = generatePdf;
    }
  };

  const handlePassengerListDocx = async () => {
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("#")] }),
          new TableCell({ children: [new Paragraph("Full Name")] }),
          new TableCell({ children: [new Paragraph("Passport Number")] }),
          new TableCell({ children: [new Paragraph("Seat")] }),
          new TableCell({ children: [new Paragraph("Type")] }),
          new TableCell({ children: [new Paragraph("Phone")] }),
          new TableCell({ children: [new Paragraph("NOK Name")] }),
          new TableCell({ children: [new Paragraph("NOK Number")] }),
          new TableCell({ children: [new Paragraph("Infant")] }),
        ]
      }),
      ...paddedPassengerList.map((p, idx) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(idx + 1))] }),
            new TableCell({ children: [new Paragraph(p.name || " ")] }),
            new TableCell({ children: [new Paragraph(p.passportNumber || " ")] }),
            new TableCell({ children: [new Paragraph(p.seat)] }),
            new TableCell({ children: [new Paragraph(p.type || " ")] }),
            new TableCell({ children: [new Paragraph(p.phone || " ")] }),
            new TableCell({ children: [new Paragraph(p.nokName || " ")] }),
            new TableCell({ children: [new Paragraph(p.nokPhone || " ")] }),
            new TableCell({
              children: [
                new Paragraph(
                  p.hasInfant
                    ? `Yes${p.infantName ? `, Name: ${p.infantName}` : ""}${p.infantBirthdate ? `, DOB: ${p.infantBirthdate}` : ""}${p.infantPassportNumber ? `, Passport: ${p.infantPassportNumber}` : ""}`
                    : " "
                )
              ]
            }),
          ]
        })
      )
    ];

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Passenger List", heading: "Heading1" }),
          new Paragraph({ text: `Route: ${route}` }),
          new Paragraph({ text: `Date: ${date}` }),
          new Paragraph({ text: `Time: ${time}` }),
          new Table({ rows }),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `passenger-list-${route}-${date.replace(/\s+/g, '-')}.docx`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-8 px-4 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentTripPassengers.length) {
    alert("No passenger data to export.");
    return;
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => (typeof onBack === "function" ? onBack() : router.push("/admin?tab=schedule"))}
            className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bus Schedule
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-6">
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Passenger Manifest</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Route:</span> {route}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Date:</span> {date}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Time:</span> {time}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Passengers:</span> {currentTripPassengers.length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={handlePdfDownload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">PDF</span>
              </button>
              <button
                onClick={handleExcelDownload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">Excel</span>
              </button>
              <button
                onClick={handlePassengerListDownload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#009393] text-white rounded-lg shadow-sm hover:bg-[#007575] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">PL <span className="hidden md:inline">PDF</span></span>
              </button>
              <button
                onClick={handlePassengerListDocx}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#958c55] text-white rounded-lg shadow-sm hover:bg-[#bfae7c] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">PL <span className="hidden md:inline">DOCX</span></span>
              </button>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-orange-600 text-white rounded-lg shadow-sm hover:bg-orange-700 transition-colors font-bold"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Board <span className="hidden md:inline">Walk-in</span></span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Passenger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Passenger</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Seat</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Title</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">NOK Name</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">NOK Number</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Ref</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Agent</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pay</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Infant</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {displayedPassengers.map((passenger, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          {passenger.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{passenger.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-900 font-mono">{passenger.seat}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                        {passenger.title}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                      {passenger.phone}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden xl:table-cell">
                      {passenger.nokName}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden xl:table-cell">
                      {passenger.nokPhone}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono hidden sm:table-cell">
                      {passenger.bookingRef}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                      {passenger.agent}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full ${String(passenger.paymentStatus || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {String(passenger.paymentStatus || '').toLowerCase() === 'paid' ? 'PAID' : 'DUE'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                      {passenger.hasInfant ? (
                        <span className="text-green-700 font-semibold">
                          Yes
                          {passenger.infantName && (
                            <span className="block text-xs text-slate-700">
                              Name: {passenger.infantName}
                            </span>
                          )}
                          {passenger.infantBirthdate && (
                            <span className="block text-xs text-slate-700">
                              DOB: {passenger.infantBirthdate}
                            </span>
                          )}
                          {passenger.infantPassportNumber && (
                            <span className="block text-xs text-slate-700">
                              Passport: {passenger.infantPassportNumber}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${passenger.boarded ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                        {passenger.boarded ? 'Boarded' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Trip Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:shadow-md">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Passengers</div>
              <div className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{displayedPassengers.length}</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 transition-all hover:shadow-md">
              <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Boarded</div>
              <div className="mt-1 text-2xl md:text-3xl font-bold text-green-700">
                {displayedPassengers.filter(p => p.boarded).length}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 transition-all hover:shadow-md sm:col-span-2 md:col-span-1">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending</div>
              <div className="mt-1 text-2xl md:text-3xl font-bold text-amber-700">
                {displayedPassengers.filter(p => !p.boarded).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickAddPassengerModal 
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        trip={tripData}
        bookings={bookings}
        onSuccess={() => fetchManifestData()}
      />
    </div>
  );
}