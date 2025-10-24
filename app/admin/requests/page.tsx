// app/admin/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, Download, Users, ChevronLeft, ChevronRight } from "lucide-react";
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
  specialRequests?: string;
  status: string;
  requestedAt: string;
}

export default function InquiriesManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalClosing, setModalClosing] = useState(false);

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
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || inquiry.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All</SelectItem>
                  <SelectItem value="approved" className="text-xs sm:text-sm">Approved</SelectItem>
                  <SelectItem value="pending" className="text-xs sm:text-sm">Pending</SelectItem>
                  <SelectItem value="cancelled" className="text-xs sm:text-sm">Cancelled</SelectItem>
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
            </div>
          </div>
        </CardContent>
      </Card>

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
                          <Badge
                            className={cn(
                              "text-xs",
                              inquiry.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : inquiry.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            )}
                          >
                            {inquiry.status}
                          </Badge>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">
                            {inquiry.passengers} passengers
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInquiry(inquiry)}
                            className="text-gray-600 hover:text-teal-600 p-1 sm:p-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(totalPages)}
                        className="h-8 w-8"
                      >
                        {totalPages}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
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

      {showInquiryDetails && (
        <Dialog
          open={showInquiryDetails}
          onOpenChange={setShowInquiryDetails}
        >
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
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Passengers:</span>
                      <span className="font-semibold">{selectedInquiry.passengers}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-teal-600 w-24 sm:w-32">Requested At:</span>
                      <span className="font-semibold">{selectedInquiry.requestedAt}</span>
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
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Approved")}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-1 h-8 sm:h-9"
                    size="sm"
                    disabled={selectedInquiry.status === "Approved"}
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Declined")}
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
    </div>
  );
}