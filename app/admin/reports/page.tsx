"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";
import { Download, ArrowUpRight, Calendar, Route, User, BarChart2, Clock, TrendingUp, PieChart as PieChartIcon } from "lucide-react";

// Dynamic imports for better performance
const BarChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });
const LineChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });
const PieChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Pie), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types (unchanged from original)
interface RouteSales {
  routeName: string;
  route: string;
  totalBookings: number;
  totalRevenue: number;
  times: {
    departureTime: string;
    bookings: number;
    revenue: number;
  }[];
  bestDay: string;
  bestMonth: string;
}

interface AgentSales {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  commission: number;
}

interface ConsultantSales {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  commission: number;
}

// Updated color scheme using company colors
const COLORS = {
  primary: "rgb(0, 153, 153)",       // Teal
  secondary: "rgb(148, 138, 84)",    // Muted gold
  accent: "rgb(255, 192, 0)",        // Vibrant gold
  background: "#f8fafc",
  text: "#0f172a",
  chartBackground: "rgba(0, 153, 153, 0.1)"
};

export default function ReportsPage() {
  // State (unchanged from original)
  const [routeSales, setRouteSales] = useState<RouteSales[]>([]);
  const [agentSales, setAgentSales] = useState<AgentSales[]>([]);
  const [consultantSales, setConsultantSales] = useState<ConsultantSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("month");

  // KPI Metrics with safe defaults (unchanged from original)
  const kpis = useMemo(() => {
    const safeRouteSales = routeSales || [];
    const safeAgentSales = agentSales || [];
    
    const totalRevenue = safeRouteSales.reduce((sum, route) => sum + (route?.totalRevenue || 0), 0);
    const totalBookings = safeRouteSales.reduce((sum, route) => sum + (route?.totalBookings || 0), 0);
    const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const bestRoute = safeRouteSales.length > 0
      ? safeRouteSales.reduce((best, current) =>
          (current?.totalRevenue || 0) > (best?.totalRevenue || 0) ? current : best
        )
      : null;

    const bestAgent = safeAgentSales.length > 0
      ? safeAgentSales.reduce((best, current) =>
          (current?.revenue || 0) > (best?.revenue || 0) ? current : best
        )
      : null;

    return {
      totalRevenue,
      totalBookings,
      avgRevenuePerBooking,
      bestRoute: bestRoute 
        ? `${bestRoute.routeName || 'Unknown'} (P${(bestRoute.totalRevenue || 0).toLocaleString()})` 
        : "N/A",
      bestAgent: bestAgent 
        ? `${bestAgent.name || 'Unknown'} (P${(bestAgent.revenue || 0).toLocaleString()})` 
        : "N/A",
      peakPerformance: bestRoute 
        ? `${bestRoute.bestDay || 'Unknown'} at ${bestRoute.times?.[0]?.departureTime || 'N/A'}` 
        : "N/A"
    };
  }, [routeSales, agentSales]);

  // Data fetching (unchanged from original)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [routeRes, agentRes, consultantRes] = await Promise.all([
          fetch("/api/reports/sales-by-route").then(res => {
            if (!res.ok) throw new Error("Failed to fetch route sales");
            return res.json();
          }),
          fetch("/api/reports/sales-by-agent").then(res => {
            if (!res.ok) throw new Error("Failed to fetch agent sales");
            return res.json();
          }),
          fetch("/api/reports/sales-by-consultant").then(res => {
            if (!res.ok) throw new Error("Failed to fetch consultant sales");
            return res.json();
          }),
        ]);

        setRouteSales(Array.isArray(routeRes) ? routeRes : []);
        setAgentSales(Array.isArray(agentRes) ? agentRes : []);
        setConsultantSales(Array.isArray(consultantRes) ? consultantRes : []);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setRouteSales([]);
        setAgentSales([]);
        setConsultantSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter options with memoization (unchanged from original)
  const { routeOptions, monthOptions } = useMemo(() => {
    const safeRouteSales = routeSales || [];
    
    const routeOpts = [
      { label: "All Routes", value: "all" },
      ...safeRouteSales.map((r) => ({
        label: `${r.routeName || 'Unknown'} (${r.route || 'N/A'})`,
        value: r.route || '',
      })),
    ];

    const months = new Set<string>();
    safeRouteSales.forEach((r) => {
      if (r.bestMonth) months.add(r.bestMonth);
    });
    
    const monthOpts = [
      { label: "All Months", value: "all" },
      ...Array.from(months).map((m) => {
        const [year, month] = m.split("-");
        return {
          label: `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`,
          value: m,
        };
      }),
    ];

    return { routeOptions: routeOpts, monthOptions: monthOpts };
  }, [routeSales]);

  // Filtered data (unchanged from original)
  const filteredRoutes = useMemo(() => {
    const safeRouteSales = routeSales || [];
    let filtered = safeRouteSales;
    
    if (selectedRoute !== "all") {
      filtered = filtered.filter((r) => r.route === selectedRoute);
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter((r) => r.bestMonth === selectedMonth);
    }
    return filtered;
  }, [routeSales, selectedRoute, selectedMonth]);

  // Chart data preparation with updated colors
  const chartData = useMemo(() => {
    const safeRouteSales = routeSales || [];
    const safeAgentSales = agentSales || [];
    const safeConsultantSales = consultantSales || [];
    const safeFilteredRoutes = filteredRoutes || [];

    // Revenue vs Bookings by Route
    const routeLabels = safeFilteredRoutes.map((r) => r.routeName || 'Unknown');
    const bookingsData = safeFilteredRoutes.map((r) => r.totalBookings || 0);
    const revenueData = safeFilteredRoutes.map((r) => r.totalRevenue || 0);

    // Revenue trend by month
    const monthMap: Record<string, number> = {};
    safeRouteSales.forEach((r) => {
      if (r.bestMonth) {
        monthMap[r.bestMonth] = (monthMap[r.bestMonth] || 0) + (r.totalRevenue || 0);
      }
    });

    const monthsSorted = Object.keys(monthMap).sort();
    const monthLabels = monthsSorted.map((m) => {
      const [year, month] = m.split("-");
      return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
    });
    const monthRevenue = monthsSorted.map((m) => monthMap[m]);

    // Top performing data
    const topRoutes = [...safeFilteredRoutes]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);

    const topAgents = [...safeAgentSales]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    const topConsultants = [...safeConsultantSales]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    return {
      routeComparison: {
        labels: routeLabels,
        datasets: [
          {
            label: "Bookings",
            data: bookingsData,
            backgroundColor: COLORS.accent,
            borderRadius: 6,
            order: 2,
          },
          {
            label: "Revenue (P)",
            data: revenueData,
            backgroundColor: COLORS.primary,
            borderRadius: 6,
            order: 1,
          },
        ],
      },
      revenueTrend: {
        labels: monthLabels,
        datasets: [
          {
            label: "Monthly Revenue (P)",
            data: monthRevenue,
            fill: true,
            backgroundColor: COLORS.chartBackground,
            borderColor: COLORS.primary,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: COLORS.primary,
          },
        ],
      },
      revenueDistribution: {
        labels: topRoutes.map((r) => r.routeName || 'Unknown'),
        datasets: [
          {
            data: topRoutes.map((r) => r.totalRevenue || 0),
            backgroundColor: [
              COLORS.primary,
              COLORS.secondary,
              COLORS.accent,
              "rgba(0, 153, 153, 0.7)",
              "rgba(148, 138, 84, 0.7)"
            ],
            borderWidth: 1,
          },
        ],
      },
      topAgents: {
        labels: topAgents.map((a) => a.name || 'Unknown'),
        datasets: [
          {
            label: "Revenue (P)",
            data: topAgents.map((a) => a.revenue || 0),
            backgroundColor: COLORS.secondary,
            borderRadius: 6,
          },
        ],
      },
      topConsultants: {
        labels: topConsultants.map((c) => c.name || 'Unknown'),
        datasets: [
          {
            label: "Revenue (P)",
            data: topConsultants.map((c) => c.revenue || 0),
            backgroundColor: COLORS.accent,
            borderRadius: 6,
          },
        ],
      },
    };
  }, [filteredRoutes, routeSales, agentSales, consultantSales]);

  // Excel export (unchanged from original)
  const downloadExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // 1. Summary Sheet
      const summaryData = [
        ["Transport Performance Summary", "", "", ""],
        ["Generated", new Date().toLocaleString(), "", ""],
        ["", "", "", ""],
        ["Key Metrics", "Value", "", ""],
        ["Total Revenue", `P${kpis.totalRevenue.toLocaleString()}`, "", ""],
        ["Total Bookings", kpis.totalBookings.toLocaleString(), "", ""],
        ["Average Revenue per Booking", `P${kpis.avgRevenuePerBooking.toFixed(2)}`, "", ""],
        ["Top Performing Route", kpis.bestRoute, "", ""],
        ["Top Performing Agent", kpis.bestAgent, "", ""],
        ["Peak Performance Time", kpis.peakPerformance, "", ""]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // 2. Route Performance Sheet
      const routeHeaders = ["Route Name", "Route Code", "Departure Time", "Bookings", "Revenue", "Best Day", "Best Month"];
      const routeRows = (filteredRoutes || []).flatMap((route) =>
        (route.times || []).map((time) => [
          route.routeName || '',
          route.route || '',
          time.departureTime || '',
          time.bookings || 0,
          time.revenue || 0,
          route.bestDay || '',
          route.bestMonth || ''
        ])
      );

      if (routeRows.length > 0) {
        const routeSheet = XLSX.utils.aoa_to_sheet([routeHeaders, ...routeRows]);
        XLSX.utils.book_append_sheet(workbook, routeSheet, "Route Performance");
      }

      // 3. Agent Performance Sheet
      const agentHeaders = ["Agent Name", "Bookings", "Revenue", "Commission", "Avg. Ticket Value"];
      const agentRows = (agentSales || []).map((agent) => [
        agent.name || '',
        agent.bookings || 0,
        agent.revenue || 0,
        agent.commission || 0,
        agent.bookings ? (agent.revenue || 0) / agent.bookings : 0
      ]);

      if (agentRows.length > 0) {
        const agentSheet = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
        XLSX.utils.book_append_sheet(workbook, agentSheet, "Agent Performance");
      }

      // 4. Consultant Performance Sheet
      const consultantHeaders = ["Consultant Name", "Bookings", "Revenue", "Commission", "Avg. Ticket Value"];
      const consultantRows = (consultantSales || []).map((consultant) => [
        consultant.name || '',
        consultant.bookings || 0,
        consultant.revenue || 0,
        consultant.commission || 0,
        consultant.bookings ? (consultant.revenue || 0) / consultant.bookings : 0
      ]);

      if (consultantRows.length > 0) {
        const consultantSheet = XLSX.utils.aoa_to_sheet([consultantHeaders, ...consultantRows]);
        XLSX.utils.book_append_sheet(workbook, consultantSheet, "Consultant Performance");
      }

      // Generate Excel file
      XLSX.writeFile(workbook, `Transport_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel file:", err);
      alert("Failed to generate Excel report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 border border-gray-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-full rounded-lg" />
              </Card>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 h-80 border border-gray-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-full w-full rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center border border-red-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transport Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Comprehensive insights for optimizing operations and maximizing revenue
          </p>
        </div>
        <Button
          onClick={downloadExcel}
          className="bg-[rgb(0,153,153)] hover:bg-[rgba(0,153,153,0.9)] text-white shadow rounded-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          <span>Export Full Report</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardHeader className="pb-2 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <BarChart2 className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              P{(kpis.totalRevenue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all routes</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardHeader className="pb-2 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Route className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {(kpis.totalBookings || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total tickets sold</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardHeader className="pb-2 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Avg. Ticket Value</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              P{(kpis.avgRevenuePerBooking || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per booking</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardHeader className="pb-2 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Route className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Top Route</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">
              {kpis.bestRoute}
            </p>
            <p className="text-xs text-gray-500 mt-1">Highest revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardHeader className="pb-2 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Peak Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">
              {kpis.peakPerformance}
            </p>
            <p className="text-xs text-gray-500 mt-1">Best performing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="route-filter" className="block text-xs sm:text-sm font-medium text-gray-700">
                Route
              </Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-10 rounded-lg">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {routeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="month-filter" className="block text-xs sm:text-sm font-medium text-gray-700">
                Month
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-10 rounded-lg">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="timeframe-filter" className="block text-xs sm:text-sm font-medium text-gray-700">
                Timeframe
              </Label>
              <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-10 rounded-lg">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="day" className="text-xs sm:text-sm">Daily</SelectItem>
                  <SelectItem value="week" className="text-xs sm:text-sm">Weekly</SelectItem>
                  <SelectItem value="month" className="text-xs sm:text-sm">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Route Performance */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl h-[400px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  Route Performance
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Bookings vs Revenue by route
                </CardDescription>
              </div>
              <BarChart2 className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-72px)]">
            <BarChart
              data={chartData.routeComparison}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: "top", 
                    labels: { 
                      boxWidth: 12, 
                      font: { size: 10 },
                      padding: 10
                    } 
                  },
                  tooltip: {
                    backgroundColor: 'white',
                    titleColor: COLORS.primary,
                    bodyColor: '#333',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.y ?? context.parsed?.x ?? context.parsed;
                        return value !== undefined 
                          ? `${context.dataset.label || ''}: ${value.toLocaleString()}${(context.dataset.label || '').includes('Revenue') ? 'P' : ''}`
                          : '';
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl h-[400px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Monthly revenue performance
                </CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-72px)]">
            <LineChart
              data={chartData.revenueTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: "top", 
                    labels: { 
                      boxWidth: 12, 
                      font: { size: 10 },
                      padding: 10
                    } 
                  },
                  tooltip: {
                    backgroundColor: 'white',
                    titleColor: COLORS.primary,
                    bodyColor: '#333',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.y ?? context.parsed?.x ?? context.parsed;
                        return value !== undefined ? `P${value.toLocaleString()}` : '';
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl h-[400px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  Revenue Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Top revenue-generating routes
                </CardDescription>
              </div>
              <PieChartIcon className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-72px)]">
            <PieChart
              data={chartData.revenueDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: "right",
                    labels: { 
                      boxWidth: 12,
                      font: { size: 10 },
                      padding: 10,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    backgroundColor: 'white',
                    titleColor: COLORS.primary,
                    bodyColor: '#333',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed ?? 0;
                        return `P${Number(value).toLocaleString()} (${Math.round(value / kpis.totalRevenue * 100)}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl h-[400px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  Top Agents
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Revenue by sales agent
                </CardDescription>
              </div>
              <User className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-72px)]">
            <BarChart
              data={chartData.topAgents}
              options={{
                indexAxis: "y" as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'white',
                    titleColor: COLORS.primary,
                    bodyColor: '#333',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.x ?? context.parsed?.y ?? context.parsed;
                        return value !== undefined ? `P${value.toLocaleString()}` : '';
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  y: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data */}
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="bg-white border border-gray-200 w-full overflow-x-auto rounded-lg">
          <TabsTrigger 
            value="routes" 
            className="data-[state=active]:bg-[rgba(0,153,153,0.1)] data-[state=active]:text-[rgb(0,153,153)] data-[state=active]:border-b-2 data-[state=active]:border-[rgb(0,153,153)] text-xs sm:text-sm whitespace-nowrap rounded-lg"
          >
            Route Performance
          </TabsTrigger>
          <TabsTrigger 
            value="agents" 
            className="data-[state=active]:bg-[rgba(0,153,153,0.1)] data-[state=active]:text-[rgb(0,153,153)] data-[state=active]:border-b-2 data-[state=active]:border-[rgb(0,153,153)] text-xs sm:text-sm whitespace-nowrap rounded-lg"
          >
            Agent Performance
          </TabsTrigger>
          <TabsTrigger 
            value="consultants" 
            className="data-[state=active]:bg-[rgba(0,153,153,0.1)] data-[state=active]:text-[rgb(0,153,153)] data-[state=active]:border-b-2 data-[state=active]:border-[rgb(0,153,153)] text-xs sm:text-sm whitespace-nowrap rounded-lg"
          >
            Consultant Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Route Performance Details
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Breakdown by departure time and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Route</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Departure</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Peak Day</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Peak Month</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                          No data available for selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.flatMap((route) =>
                        (route.times || []).map((time) => (
                          <TableRow 
                            key={`${route.route || ''}-${time.departureTime || ''}`} 
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium text-xs sm:text-sm">{route.routeName || 'Unknown'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{time.departureTime || 'N/A'}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{(time.bookings || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">P{(time.revenue || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{route.bestDay || 'N/A'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {route.bestMonth 
                                ? new Date(route.bestMonth).toLocaleString('default', { month: 'short' }) 
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Agent Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Sales performance metrics by agent
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Agent</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Commission</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                          No agent data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentSales.map((agent) => (
                        <TableRow key={agent.id || ''} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">{agent.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{(agent.bookings || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(agent.revenue || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(agent.commission || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            P{agent.bookings ? ((agent.revenue || 0) / agent.bookings).toFixed(2) : 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultants">
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Consultant Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Sales performance metrics by consultant
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Consultant</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Commission</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultantSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                          No consultant data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      consultantSales.map((consultant) => (
                        <TableRow key={consultant.id || ''} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">{consultant.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{(consultant.bookings || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(consultant.revenue || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(consultant.commission || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            P{consultant.bookings ? ((consultant.revenue || 0) / consultant.bookings).toFixed(2) : 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}