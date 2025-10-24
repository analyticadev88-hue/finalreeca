"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  User,
  XCircle,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

// Define color variables based on company colors
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#f5f5f5',         // Light gray
  dark: '#1a1a1a',          // Dark gray
  light: '#ffffff',         // White
  destructive: '#ef4444'    // Red (kept for errors)
};

export default function ConsultantManagementPage() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<any | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [consultantBookings, setConsultantBookings] = useState<any[]>([]);
  const [consultantSales, setConsultantSales] = useState<any>({
    bookings: 0,
    revenue: 0,
    commission: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/consultants")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch consultants");
        return res.json();
      })
      .then((data) => {
        setConsultants(data.consultants || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load consultants.");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve consultant");
      setConsultants(
        consultants.map((c) => (c.id === id ? { ...c, approved: true } : c))
      );
    } catch (error) {
      console.error("Error approving consultant:", error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/decline`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to decline consultant");
      setConsultants(consultants.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error declining consultant:", error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/remove`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to remove consultant");
      setConsultants(consultants.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error removing consultant:", error);
    }
  };

  const handleViewActivity = async (id: string) => {
    setActivityModalOpen(true);
    try {
      const bookingsResponse = await fetch(`/api/consultants/${id}/bookings`);
      const salesResponse = await fetch(`/api/reports/sales-by-consultant`);
      if (!bookingsResponse.ok || !salesResponse.ok) throw new Error("Failed to fetch activity data");
      const bookingsData = await bookingsResponse.json();
      const salesData = await salesResponse.json();
      setConsultantBookings(bookingsData.bookings || []);
      const consultantSalesData = salesData.find((s: any) => s.id === id) || { bookings: 0, revenue: 0, commission: 0 };
      setConsultantSales(consultantSalesData);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };

  const filteredConsultants = consultants.filter(consultant => 
    consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12" style={{ backgroundColor: colors.muted }}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: colors.muted }}>
        <div className="bg-red-100 p-4 rounded-full">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-red-600">Error Loading Consultants</h2>
        <p className="text-gray-600">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!consultants.length) {
    return (
      <div className="container mx-auto px-4 py-12" style={{ backgroundColor: colors.muted }}>
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="bg-blue-100 p-6 rounded-full">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: colors.dark }}>No Consultants Found</h2>
          <p className="text-lg" style={{ color: colors.accent }}>
            There are currently no consultants registered in the system.
          </p>
          <Button 
            className="mt-4" 
            style={{ backgroundColor: colors.primary }}
          >
            Invite Consultants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ backgroundColor: colors.muted }}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.dark }}>Consultant Management</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: colors.accent }}>
              Manage and review all consultant activities and approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1 sm:px-4 sm:py-2" style={{ borderColor: colors.primary }}>
              <User className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
              <span style={{ color: colors.primary }}>{consultants.length} Consultants</span>
            </Badge>
          </div>
        </div>

        <Card style={{ backgroundColor: colors.light, borderColor: colors.accent }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle style={{ color: colors.dark }}>Consultant List</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.accent }} />
                <Input
                  type="text"
                  placeholder="Search consultants..."
                  className="pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.accent }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ backgroundColor: colors.muted }}>
                  <TableRow>
                    <TableHead className="min-w-[150px]" style={{ color: colors.dark }}>Consultant</TableHead>
                    <TableHead className="min-w-[150px]" style={{ color: colors.dark }}>Contact</TableHead>
                    <TableHead style={{ color: colors.dark }}>Status</TableHead>
                    <TableHead className="text-right min-w-[250px]" style={{ color: colors.dark }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultants.map((consultant) => (
                    <TableRow key={consultant.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={consultant.image} />
                            <AvatarFallback>
                              {consultant.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm sm:text-base" style={{ color: colors.dark }}>{consultant.name}</div>
                            <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>
                              {consultant.organization}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors.accent }} />
                            <span style={{ color: colors.dark }}>{consultant.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors.accent }} />
                            <span style={{ color: colors.dark }}>{consultant.mobile || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {consultant.suspended ? (
                          <Badge variant="destructive" className="gap-1 text-xs sm:text-sm">
                            <Clock className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : consultant.approved ? (
                          <Badge className="gap-1 text-xs sm:text-sm" style={{ backgroundColor: colors.primary }}>
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs sm:text-sm" style={{ borderColor: colors.secondary }}>
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
                          {!consultant.approved && !consultant.suspended && (
                            <>
                              <Button
                                size="sm"
                                className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                                onClick={() => handleApprove(consultant.id)}
                                style={{ backgroundColor: colors.primary }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="sr-only sm:not-sr-only">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                                onClick={() => handleDecline(consultant.id)}
                                style={{ borderColor: colors.destructive, color: colors.destructive }}
                              >
                                <XCircle className="h-3 w-3" />
                                <span className="sr-only sm:not-sr-only">Decline</span>
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => setSelectedConsultant(consultant)}
                            style={{ borderColor: colors.primary, color: colors.primary }}
                          >
                            <User className="h-3 w-3" />
                            <span className="sr-only sm:not-sr-only">Details</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => handleViewActivity(consultant.id)}
                            style={{ borderColor: colors.accent, color: colors.accent }}
                          >
                            <Activity className="h-3 w-3" />
                            <span className="sr-only sm:not-sr-only">Activity</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => handleRemove(consultant.id)}
                          >
                            <XCircle className="h-3 w-3" />
                            <span className="sr-only sm:not-sr-only">Remove</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultant Details Modal */}
      {selectedConsultant && (
        <Dialog open={!!selectedConsultant} onOpenChange={() => setSelectedConsultant(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.dark }}>
                <User className="h-5 w-5" style={{ color: colors.primary }} />
                Consultant Details
              </DialogTitle>
              <DialogDescription style={{ color: colors.accent }}>
                Full profile information for {selectedConsultant.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedConsultant.image} />
                  <AvatarFallback>
                    {selectedConsultant.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold" style={{ color: colors.dark }}>{selectedConsultant.name}</h3>
                  <p className="text-sm" style={{ color: colors.accent }}>
                    {selectedConsultant.organization}
                  </p>
                  <div className="mt-1">
                    {selectedConsultant.approved ? (
                      <Badge style={{ backgroundColor: colors.primary }}>Approved</Badge>
                    ) : (
                      <Badge variant="outline" style={{ borderColor: colors.secondary }}>Pending Approval</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium" style={{ color: colors.dark }}>Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" style={{ color: colors.accent }} />
                    <span style={{ color: colors.dark }}>{selectedConsultant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" style={{ color: colors.accent }} />
                    <span style={{ color: colors.dark }}>{selectedConsultant.mobile || "Not provided"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium" style={{ color: colors.dark }}>Identification</h4>
                  <div className="text-sm" style={{ color: colors.dark }}>
                    ID: {selectedConsultant.idNumber || "Not provided"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium" style={{ color: colors.dark }}>Performance Metrics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <Card className="text-center p-3 sm:p-4 shadow-none border" style={{ backgroundColor: colors.muted, borderColor: colors.accent }}>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {consultantSales.bookings}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Bookings</div>
                  </Card>
                  <Card className="text-center p-3 sm:p-4 shadow-none border" style={{ backgroundColor: colors.muted, borderColor: colors.accent }}>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {consultantSales.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Revenue (BWP)</div>
                  </Card>
                  <Card className="text-center p-3 sm:p-4 shadow-none border" style={{ backgroundColor: colors.muted, borderColor: colors.accent }}>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {consultantSales.commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Commission (BWP)</div>
                  </Card>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
                {!selectedConsultant.approved && (
                  <Button 
                    onClick={() => handleApprove(selectedConsultant.id)}
                    className="w-full sm:w-auto"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Approve Consultant
                  </Button>
                )}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedConsultant(null)}
                    className="w-full sm:w-auto"
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDecline(selectedConsultant.id)}
                    className="w-full sm:w-auto"
                  >
                    Decline Consultant
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Activity Modal */}
      {activityModalOpen && (
        <Dialog open={activityModalOpen} onOpenChange={() => setActivityModalOpen(false)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.dark }}>
                <Activity className="h-5 w-5" style={{ color: colors.primary }} />
                Consultant Activity
              </DialogTitle>
              <DialogDescription style={{ color: colors.accent }}>
                Detailed booking and sales information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>
                      Total Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.dark }}>
                      {consultantSales.bookings}
                    </div>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.dark }}>
                      {consultantSales.revenue.toLocaleString()} BWP
                    </div>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>
                      Total Commission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.dark }}>
                      {consultantSales.commission.toLocaleString()} BWP
                    </div>
                    <div className="text-xs" style={{ color: colors.accent }}>
                      5% commission rate
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-4" style={{ color: colors.dark }}>Recent Bookings</h4>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader style={{ backgroundColor: colors.muted }}>
                        <TableRow>
                          <TableHead style={{ color: colors.dark }}>Order ID</TableHead>
                          <TableHead style={{ color: colors.dark }}>Customer</TableHead>
                          <TableHead style={{ color: colors.dark }}>Route</TableHead>
                          <TableHead className="text-right" style={{ color: colors.dark }}>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consultantBookings.length > 0 ? (
                          consultantBookings.map((booking) => (
                            <TableRow key={booking.id} style={{ backgroundColor: colors.light }}>
                              <TableCell className="font-medium text-xs sm:text-sm" style={{ color: colors.dark }}>
                                {booking.orderId}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm" style={{ color: colors.dark }}>{booking.userName}</TableCell>
                              <TableCell className="text-xs sm:text-sm" style={{ color: colors.dark }}>
                                <span className="line-clamp-1">{booking.trip.routeName} ({booking.trip.departureDate})</span>
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm" style={{ color: colors.dark }}>
                                {booking.totalPrice} BWP
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8" style={{ backgroundColor: colors.light }}>
                              <div style={{ color: colors.accent }}>
                                No bookings found for this consultant
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4" style={{ color: colors.dark }}>Performance Overview</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm" style={{ color: colors.dark }}>Booking Completion</span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>85%</span>
                  </div>
                  <Progress value={85} className="h-2" style={{ backgroundColor: colors.muted }} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setActivityModalOpen(false)}
                className="w-full sm:w-auto"
                style={{ backgroundColor: colors.primary }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}