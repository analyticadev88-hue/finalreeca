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
  Gauge,
  CreditCard,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Color palette
const colors = {
  primary: "hsl(240, 5%, 26%)",       // Dark slate
  secondary: "hsl(210, 20%, 98%)",    // Light background
  accent: "hsl(210, 80%, 60%)",       // Vibrant blue
  success: "hsl(142, 72%, 45%)",      // Green
  warning: "hsl(38, 92%, 50%)",       // Amber
  destructive: "hsl(0, 84%, 60%)",    // Red
  muted: "hsl(240, 5%, 96%)",         // Very light slate
  border: "hsl(240, 5%, 90%)",        // Borders
};

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [agentBookings, setAgentBookings] = useState<any[]>([]);
  const [agentSales, setAgentSales] = useState<any>({
    bookings: 0,
    revenue: 0,
    commission: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch agents");
        return res.json();
      })
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load agents.");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve agent");
      setAgents(
        agents.map((a) => (a.id === id ? { ...a, approved: true } : a))
      );
    } catch (error) {
      console.error("Error approving agent:", error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/decline`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to decline agent");
      setAgents(agents.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error declining agent:", error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/remove`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to remove agent");
      setAgents(agents.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error removing agent:", error);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days: 30 }),
      });
      if (!response.ok) throw new Error("Failed to suspend agent");
      setAgents(
        agents.map((a) =>
          a.id === id ? { ...a, suspended: true, suspensionDate: new Date() } : a
        )
      );
    } catch (error) {
      console.error("Error suspending agent:", error);
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/unsuspend`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to unsuspend agent");
      setAgents(
        agents.map((a) =>
          a.id === id ? { ...a, suspended: false, suspensionDate: null } : a
        )
      );
    } catch (error) {
      console.error("Error unsuspending agent:", error);
    }
  };

  const handleViewActivity = async (id: string) => {
    setActivityModalOpen(true);
    try {
      const bookingsResponse = await fetch(`/api/agents/${id}/bookings`);
      const salesResponse = await fetch(`/api/agents/${id}/sales`);
      if (!bookingsResponse.ok || !salesResponse.ok) throw new Error("Failed to fetch activity data");
      const bookingsData = await bookingsResponse.json();
      const salesData = await salesResponse.json();
      setAgentBookings(bookingsData.bookings || []);
      setAgentSales(salesData);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12" style={{ backgroundColor: colors.secondary }}>
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
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: colors.secondary }}>
        <div className="bg-red-100 p-4 rounded-full">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-red-600">Error Loading Agents</h2>
        <p className="text-gray-600">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
          style={{ borderColor: colors.accent, color: colors.accent }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!agents.length) {
    return (
      <div className="container mx-auto px-4 py-12" style={{ backgroundColor: colors.secondary }}>
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="bg-blue-100 p-6 rounded-full">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: colors.primary }}>No Agents Found</h2>
          <p className="text-lg" style={{ color: colors.accent }}>
            There are currently no agents registered in the system.
          </p>
          <Button 
            className="mt-4" 
            style={{ backgroundColor: colors.accent }}
          >
            Invite Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ backgroundColor: colors.secondary }}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.primary }}>Agent Management</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: colors.accent }}>
              Manage and review all agent activities and approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1 sm:px-4 sm:py-2" style={{ borderColor: colors.accent }}>
              <User className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
              <span style={{ color: colors.accent }}>{agents.length} Agents</span>
            </Badge>
          </div>
        </div>

        <Card style={{ backgroundColor: colors.secondary, borderColor: colors.border }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle style={{ color: colors.primary }}>Agent List</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.accent }} />
                <Input
                  type="text"
                  placeholder="Search agents..."
                  className="pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.border }}
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
                    <TableHead className="min-w-[150px]" style={{ color: colors.primary }}>Agent</TableHead>
                    <TableHead className="min-w-[150px]" style={{ color: colors.primary }}>Contact</TableHead>
                    <TableHead style={{ color: colors.primary }}>Status</TableHead>
                    <TableHead className="text-right min-w-[250px]" style={{ color: colors.primary }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={agent.image} />
                            <AvatarFallback>
                              {agent.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm sm:text-base" style={{ color: colors.primary }}>{agent.name}</div>
                            <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>
                              {agent.organization}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors.accent }} />
                            <span style={{ color: colors.primary }}>{agent.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors.accent }} />
                            <span style={{ color: colors.primary }}>{agent.mobile || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.suspended ? (
                          <Badge variant="destructive" className="gap-1 text-xs sm:text-sm">
                            <AlertTriangle className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : agent.approved ? (
                          <Badge className="gap-1 text-xs sm:text-sm" style={{ backgroundColor: colors.success }}>
                            <UserCheck className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs sm:text-sm" style={{ borderColor: colors.warning }}>
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
                          {!agent.approved && !agent.suspended && (
                            <>
                              <Button
                                size="sm"
                                className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                                onClick={() => handleApprove(agent.id)}
                                style={{ backgroundColor: colors.success }}
                              >
                                <UserCheck className="h-3 w-3" />
                                <span className="sr-only sm:not-sr-only">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                                onClick={() => handleDecline(agent.id)}
                                style={{ borderColor: colors.destructive, color: colors.destructive }}
                              >
                                <UserX className="h-3 w-3" />
                                <span className="sr-only sm:not-sr-only">Decline</span>
                              </Button>
                            </>
                          )}
                          {!agent.suspended && agent.approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                              onClick={() => handleSuspend(agent.id)}
                              style={{ borderColor: colors.warning, color: colors.warning }}
                            >
                              <ShieldOff className="h-3 w-3" />
                              <span className="sr-only sm:not-sr-only">Suspend</span>
                            </Button>
                          )}
                          {agent.suspended && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                              onClick={() => handleUnsuspend(agent.id)}
                              style={{ borderColor: colors.success, color: colors.success }}
                            >
                              <Shield className="h-3 w-3" />
                              <span className="sr-only sm:not-sr-only">Unsuspend</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => setSelectedAgent(agent)}
                            style={{ borderColor: colors.accent, color: colors.accent }}
                          >
                            <User className="h-3 w-3" />
                            <span className="sr-only sm:not-sr-only">Details</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => handleViewActivity(agent.id)}
                            style={{ borderColor: colors.primary, color: colors.primary }}
                          >
                            <Activity className="h-3 w-3" />
                            <span className="sr-only sm:not-sr-only">Activity</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 sm:h-8 gap-1 text-xs sm:text-sm"
                            onClick={() => handleRemove(agent.id)}
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

      {/* Agent Details Modal */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.secondary }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                <User className="h-5 w-5" style={{ color: colors.accent }} />
                Agent Details
              </DialogTitle>
              <DialogDescription style={{ color: colors.accent }}>
                Full profile information for {selectedAgent.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAgent.image} />
                  <AvatarFallback>
                    {selectedAgent.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold" style={{ color: colors.primary }}>{selectedAgent.name}</h3>
                  <p className="text-sm" style={{ color: colors.accent }}>
                    {selectedAgent.organization}
                  </p>
                  <div className="mt-1">
                    {selectedAgent.approved ? (
                      <Badge style={{ backgroundColor: colors.success }}>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" style={{ borderColor: colors.warning }}>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Approval
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium" style={{ color: colors.primary }}>Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" style={{ color: colors.accent }} />
                    <span style={{ color: colors.primary }}>{selectedAgent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" style={{ color: colors.accent }} />
                    <span style={{ color: colors.primary }}>{selectedAgent.mobile || "Not provided"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium" style={{ color: colors.primary }}>Identification</h4>
                  <div className="text-sm" style={{ color: colors.primary }}>
                    ID: {selectedAgent.idNumber || "Not provided"}
                  </div>
                </div>
              </div>

              <Separator style={{ backgroundColor: colors.border }} />

              <div className="space-y-2">
                <h4 className="font-medium" style={{ color: colors.primary }}>Performance Metrics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <Card className="text-center p-3 sm:p-4" style={{ backgroundColor: colors.muted }}>
                    <div className="flex items-center justify-center gap-2">
                      <Gauge className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: colors.accent }} />
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>{agentSales.bookings}</div>
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Bookings</div>
                  </Card>
                  <Card className="text-center p-3 sm:p-4" style={{ backgroundColor: colors.muted }}>
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: colors.accent }} />
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>{agentSales.revenue.toLocaleString()}</div>
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Revenue (BWP)</div>
                  </Card>
                  <Card className="text-center p-3 sm:p-4" style={{ backgroundColor: colors.muted }}>
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: colors.accent }} />
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>{agentSales.commission.toLocaleString()}</div>
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>Commission (BWP)</div>
                  </Card>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
                {!selectedAgent.approved && (
                  <Button 
                    onClick={() => handleApprove(selectedAgent.id)}
                    className="w-full sm:w-auto"
                    size="sm"
                    style={{ backgroundColor: colors.success }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve Agent
                  </Button>
                )}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAgent(null)}
                    className="w-full sm:w-auto"
                    size="sm"
                    style={{ borderColor: colors.accent, color: colors.accent }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDecline(selectedAgent.id)}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Decline Agent
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
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.secondary }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                <Activity className="h-5 w-5" style={{ color: colors.accent }} />
                Agent Activity
              </DialogTitle>
              <DialogDescription style={{ color: colors.accent }}>
                Detailed booking and sales information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.primary }}>
                      Total Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {agentSales.bookings}
                    </div>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.primary }}>
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {agentSales.revenue.toLocaleString()} BWP
                    </div>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: colors.muted }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: colors.primary }}>
                      Total Commission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                      {agentSales.commission.toLocaleString()} BWP
                    </div>
                    <div className="text-xs" style={{ color: colors.accent }}>
                      10% commission rate
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-4" style={{ color: colors.primary }}>Recent Bookings</h4>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader style={{ backgroundColor: colors.muted }}>
                        <TableRow>
                          <TableHead style={{ color: colors.primary }}>Order ID</TableHead>
                          <TableHead style={{ color: colors.primary }}>Customer</TableHead>
                          <TableHead style={{ color: colors.primary }}>Route</TableHead>
                          <TableHead className="text-right" style={{ color: colors.primary }}>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentBookings.length > 0 ? (
                          agentBookings.map((booking) => (
                            <TableRow key={booking.id} style={{ backgroundColor: colors.secondary }}>
                              <TableCell className="font-medium text-xs sm:text-sm" style={{ color: colors.primary }}>
                                {booking.orderId}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm" style={{ color: colors.primary }}>{booking.userName}</TableCell>
                              <TableCell className="text-xs sm:text-sm" style={{ color: colors.primary }}>
                                <span className="line-clamp-1">{booking.trip.routeName} ({booking.trip.departureDate})</span>
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm" style={{ color: colors.primary }}>
                                {booking.totalPrice} BWP
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8" style={{ backgroundColor: colors.secondary }}>
                              <div style={{ color: colors.accent }}>
                                No bookings found for this agent
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
                <h4 className="font-semibold mb-4" style={{ color: colors.primary }}>Performance Overview</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm" style={{ color: colors.primary }}>Booking Completion</span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: colors.primary }}>85%</span>
                  </div>
                  <Progress value={85} className="h-2" style={{ backgroundColor: colors.muted }} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setActivityModalOpen(false)}
                className="w-full sm:w-auto"
                size="sm"
                style={{ backgroundColor: colors.accent }}
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