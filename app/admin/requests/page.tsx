// app/admin/requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, Search, CheckCircle, XCircle, Download, Users, ChevronLeft, ChevronRight,
  CalendarDays, List, Mail, Send, Clock, MapPin, Phone, ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Inquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  passengers: number;
  date: string;
  time: string;
  origin: string;
  destination: string;
  returnDate?: string;
  specialRequests?: string;
  status: string;
  requestedAt: string;
}

type EmailAction = "approve" | "reject";

export default function InquiriesManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalClosing, setModalClosing] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");

  // Email preview state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailAction, setEmailAction] = useState<EmailAction | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    async function fetchInquiries() {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      setInquiries(data.inquiries || []);
    }
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || inquiry.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calendar data
  const approvedInquiries = useMemo(() => {
    return inquiries
      .filter((i) => i.status.toLowerCase() === "approved")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [inquiries]);

  const upcomingByMonth = useMemo(() => {
    const grouped = new Map<string, Inquiry[]>();
    approvedInquiries.forEach((inq) => {
      const d = new Date(inq.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(inq);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [approvedInquiries]);

  const calendarMonthLabels = useMemo(() => {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return upcomingByMonth.map(([key]) => {
      const [year, month] = key.split("-");
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    });
  }, [upcomingByMonth]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowInquiryDetails(true);
  };

  const openEmailPreview = (inquiry: Inquiry, action: EmailAction) => {
    setSelectedInquiry(inquiry);
    setEmailAction(action);
    setEmailMessage("");
    setEmailPreviewOpen(true);
  };

  const handleSendEmailAndUpdate = async () => {
    if (!selectedInquiry || !emailAction) return;
    setSendingEmail(true);
    const newStatus = emailAction === "approve" ? "Approved" : "Declined";
    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          sendEmail: true,
          message: emailMessage || undefined,
        }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === selectedInquiry.id ? { ...inq, status: newStatus } : inq))
        );
        setEmailPreviewOpen(false);
        setEmailAction(null);
        setEmailMessage("");
        // Close detail modal too if it was open
        setShowInquiryDetails(false);
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    await fetch(`/api/inquiries/${inquiryId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      )
    );
    setModalClosing(true);
    setTimeout(() => {
      setShowInquiryDetails(false);
      setModalClosing(false);
    }, 300);
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    await fetch(`/api/inquiries/${inquiryId}/status`, {
      method: "DELETE",
    });
    setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== inquiryId));
  };

  const handleExportExcel = () => {
    const exportData = inquiries.map((inq) => ({
      "Company Name": inq.companyName,
      "Contact Person": inq.contactPerson,
      "Email": inq.email,
      "Phone": inq.phone,
      "Passengers": inq.passengers,
      "Date": inq.date,
      "Time": inq.time,
      "Return Date": inq.returnDate || "",
      "Origin": inq.origin,
      "Destination": inq.destination,
      "Special Requests": inq.specialRequests || "",
      "Status": inq.status,
      "Requested At": inq.requestedAt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bus Hire Inquiries");
    XLSX.writeFile(workbook, "bus_hire_inquiries.xlsx");
  };

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (s === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "list" | "calendar")} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list" className="text-xs sm:text-sm gap-1">
                    <List className="h-3.5 w-3.5" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs sm:text-sm gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All</SelectItem>
                  <SelectItem value="approved" className="text-xs sm:text-sm">Approved</SelectItem>
                  <SelectItem value="pending" className="text-xs sm:text-sm">Pending</SelectItem>
                  <SelectItem value="declined" className="text-xs sm:text-sm">Declined</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs sm:text-sm">10</SelectItem>
                  <SelectItem value="25" className="text-xs sm:text-sm">25</SelectItem>
                  <SelectItem value="50" className="text-xs sm:text-sm">50</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50 text-xs sm:text-sm"
                onClick={handleExportExcel}
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
                <Users className="h-4 w-4 text-teal-600" />
                <span className="font-medium">{filteredInquiries.length}</span>
                <span className="hidden sm:inline">inquiries</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIST VIEW */}
      {activeView === "list" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Inquiries
              </CardTitle>
              <div className="flex justify-between items-center">
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  {filteredInquiries.length} inquiries found
                </CardDescription>
                {filteredInquiries.length > 0 && (
                  <div className="text-xs sm:text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredInquiries.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No inquiries found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Contact
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Journey
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((inquiry) => (
                        <tr key={inquiry.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-teal-600">{inquiry.companyName}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{inquiry.contactPerson}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{inquiry.date}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm font-medium text-gray-900">{inquiry.contactPerson}</div>
                            <div className="text-xs text-gray-500">{inquiry.phone}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-xs sm:text-sm text-gray-900">
                              <span className="sm:hidden">From: </span>{inquiry.origin}
                              <span className="hidden sm:inline"> → </span>
                              <br className="sm:hidden" />
                              <span className="sm:hidden">To: </span>{inquiry.destination}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-900">{inquiry.date}</div>
                            <div className="text-xs text-gray-500">{inquiry.time}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge className={cn("text-xs border", statusColor(inquiry.status))}>
                              {inquiry.status}
                            </Badge>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              {inquiry.passengers} passengers
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              {inquiry.status.toLowerCase() === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEmailPreview(inquiry, "approve")}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 sm:p-2"
                                    title="Approve & Send Email"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEmailPreview(inquiry, "reject")}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                                    title="Decline & Send Email"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInquiry(inquiry)}
                                className="text-gray-600 hover:text-teal-600 p-1 sm:p-2"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3">
                    <div className="text-xs sm:text-sm text-gray-700">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredInquiries.length)} of{" "}
                      {filteredInquiries.length} inquiries
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1} className="h-8 px-2">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only">Prev</span>
                      </Button>
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage === 1) {
                          pageNum = i + 1;
                        } else if (currentPage === totalPages) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => paginate(pageNum)}
                            className="h-8 w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <span className="px-2 text-sm text-gray-700">...</span>
                      )}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <Button variant="outline" size="sm" onClick={() => paginate(totalPages)} className="h-8 w-8">
                          {totalPages}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages} className="h-8 px-2">
                        <span className="sr-only sm:not-sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* CALENDAR VIEW */}
      {activeView === "calendar" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-teal-600" />
                Upcoming Approved Bookings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                {approvedInquiries.length} approved upcoming trips
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {approvedInquiries.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No approved bookings</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Approved inquiries will appear here organized by month
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-4 sm:p-6">
                {upcomingByMonth.map(([key, items], monthIdx) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2 sticky top-0 bg-white z-10 pb-1 border-b">
                      <span className="text-sm font-semibold text-gray-800">
                        {calendarMonthLabels[monthIdx]}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length} trip{items.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {items.map((inq) => (
                        <div
                          key={inq.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-green-50 border border-green-200">
                              <span className="text-xs text-green-700 font-medium uppercase">
                                {new Date(inq.date).toLocaleDateString("en-GB", { month: "short" })}
                              </span>
                              <span className="text-xl font-bold text-green-800">
                                {new Date(inq.date).getDate()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {inq.time}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {inq.passengers} pax
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              {inq.origin}
                              <ArrowRightLeft className="h-3 w-3 text-gray-400 shrink-0" />
                              <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              {inq.destination}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{inq.companyName}</span>
                              <span>•</span>
                              <span>{inq.contactPerson}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {inq.phone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInquiry(inq)}
                              className="text-gray-600 hover:text-teal-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inquiry Detail Modal */}
      {showInquiryDetails && (
        <Dialog open={showInquiryDetails} onOpenChange={setShowInquiryDetails}>
          <DialogContent
            className={`max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto transition-opacity duration-300 ${modalClosing ? "opacity-0" : "opacity-100"}`}
          >
            <DialogHeader>
              <DialogTitle className="text-teal-900 text-base sm:text-lg">Inquiry Details</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Inquiry from {selectedInquiry?.companyName}
              </DialogDescription>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 text-sm sm:text-base">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600 w-24 sm:w-32">Company:</span>
                      <span className="font-semibold">{selectedInquiry.companyName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600 w-24 sm:w-32">Contact Person:</span>
                      <span className="font-semibold">{selectedInquiry.contactPerson}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600 w-24 sm:w-32">Email:</span>
                      <span className="font-semibold">{selectedInquiry.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600 w-24 sm:w-32">Phone:</span>
                      <span className="font-semibold">{selectedInquiry.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-teal-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-teal-800 text-sm sm:text-base">Journey Information</h4>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Origin:</span>
                      <span className="font-semibold">{selectedInquiry.origin}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Destination:</span>
                      <span className="font-semibold">{selectedInquiry.destination}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Date:</span>
                      <span className="font-semibold">{selectedInquiry.date}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Time:</span>
                      <span className="font-semibold">{selectedInquiry.time}</span>
                    </div>
                    {selectedInquiry.returnDate && (
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-teal-600 w-24 sm:w-32">Return Date:</span>
                        <span className="font-semibold">{selectedInquiry.returnDate}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Passengers:</span>
                      <span className="font-semibold">{selectedInquiry.passengers}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Requested At:</span>
                      <span className="font-semibold">{formatDate(selectedInquiry.requestedAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedInquiry.specialRequests && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800 text-sm sm:text-base">Special Requests</h4>
                    <p className="text-xs sm:text-sm text-blue-700">{selectedInquiry.specialRequests}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                  <Button
                    onClick={() => openEmailPreview(selectedInquiry, "approve")}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-1 h-8 sm:h-9"
                    size="sm"
                    disabled={selectedInquiry.status === "Approved"}
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openEmailPreview(selectedInquiry, "reject")}
                    disabled={selectedInquiry.status === "Declined"}
                    className="text-xs sm:text-sm py-1 h-8 sm:h-9"
                    size="sm"
                  >
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Email Preview Modal */}
      <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600" />
              {emailAction === "approve" ? "Approve & Send Email" : "Decline & Send Email"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedInquiry && (
                <span>
                  To: <strong>{selectedInquiry.email}</strong> ({selectedInquiry.contactPerson})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && emailAction && (
            <div className="space-y-4">
              {/* Email preview */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Email Preview</span>
                </div>
                <div className="p-4 bg-white space-y-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {emailAction === "approve" ? (
                        <span className="text-green-700">Inquiry Approved</span>
                      ) : (
                        <span className="text-red-700">Inquiry Update</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {emailAction === "approve"
                        ? "Your inquiry has been approved — REECA TRAVEL"
                        : "Update on your inquiry — REECA TRAVEL"}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Journey:</span>
                      <span className="font-medium">{selectedInquiry.origin} → {selectedInquiry.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date & Time:</span>
                      <span className="font-medium">{selectedInquiry.date} at {selectedInquiry.time}</span>
                    </div>
                    {emailAction === "approve" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Passengers:</span>
                        <span className="font-medium">{selectedInquiry.passengers}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 space-y-2">
                    {emailAction === "approve" ? (
                      <>
                        <p>Dear {selectedInquiry.contactPerson}{selectedInquiry.companyName ? ` (${selectedInquiry.companyName})` : ""},</p>
                        <p>We are pleased to inform you that your inquiry has been <strong>approved</strong>.</p>
                        {emailMessage && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-2 text-green-800">
                            {emailMessage}
                          </div>
                        )}
                        <p>Our team will contact you via phone call shortly to walk through the next steps and finalize your booking.</p>
                      </>
                    ) : (
                      <>
                        <p>Dear {selectedInquiry.contactPerson}{selectedInquiry.companyName ? ` (${selectedInquiry.companyName})` : ""},</p>
                        <p>Thank you for your interest in REECA TRAVEL. After careful review, we regret to inform you that we are unable to accommodate your inquiry at this time.</p>
                        {emailMessage && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-2 text-red-800">
                            {emailMessage}
                          </div>
                        )}
                        <p>We would love to assist you with an alternative date or route. Please reach out to us and we’ll do our best to find a suitable option.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom message */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Custom Message (optional)
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder={
                    emailAction === "approve"
                      ? "e.g., Please expect a call from our booking team within 24 hours."
                      : "e.g., Unfortunately all coaches are fully booked for this date. We can offer 12 June instead."
                  }
                  className="text-xs sm:text-sm min-h-[80px]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={handleSendEmailAndUpdate}
                  disabled={sendingEmail}
                  className={cn(
                    "text-white text-xs sm:text-sm",
                    emailAction === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {sendingEmail ? "Sending..." : "Send Email & Update"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailPreviewOpen(false);
                    setEmailAction(null);
                    setEmailMessage("");
                  }}
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
