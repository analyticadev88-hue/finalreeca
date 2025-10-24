'use client';
import { useEffect, useState } from "react";
import { Download, Eye, ChevronRight, Clock, MapPin, Bus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface ScheduleBus {
  id: string;
  busNumber: string;
  model: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  occupiedSeats: string[];
  revenue: number;
  status: string;
  hasDeparted: boolean;
  passengerCount: number;
  bookingCount: number;
  hasPassengers: boolean;
}

interface BusScheduleContentProps {
  basePath?: string;
  onViewManifest?: (busId: string) => void;
}

export default function BusScheduleContent({ basePath = '/admin', onViewManifest }: BusScheduleContentProps) {
  const [buses, setBuses] = useState<ScheduleBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const router = useRouter();

  const fetchBuses = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/fleet/schedule?date=${formattedDate}`);
      if (!res.ok) throw new Error('Failed to fetch buses');
      const data = await res.json();
      setBuses(data);
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses(date);
  }, [date]);

  // View manifest handler
  const viewManifest = (busId: string) => {
    if (onViewManifest) {
      onViewManifest(busId);
    } else {
      // Default behavior if no custom handler provided
      router.push(`${basePath}/manifest/${busId}`);
    }
  };

  // Download manifest handler
  const downloadManifest = (busId: string) => {
    // Implement download logic here
    console.log(`Downloading manifest for bus ${busId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bus className="w-7 h-7 text-teal-600" />
            Fleet Operations
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View bus schedules and manifests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
            Filter Routes
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6">
                  <div className="md:col-span-3 flex items-center">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start md:items-end lg:items-center gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : buses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buses scheduled</h3>
            <p className="text-gray-500">
              There are no buses scheduled for {format(date, "MMMM d, yyyy")}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {buses.map(bus => (
            <Card key={bus.id} className="overflow-hidden transition-all hover:shadow-md group border-teal-50">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6">
                  {/* Bus Identification */}
                  <div className="md:col-span-3 flex items-center">
                    <div className="bg-teal-100 p-3 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <Bus className="w-6 h-6 text-teal-700" />
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900 text-lg">{bus.busNumber}</div>
                      <div className="text-sm text-gray-500">{bus.model}</div>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="md:col-span-3 flex flex-col justify-center">
                    <div className="flex items-center text-sm text-gray-800 font-medium mb-1">
                      <MapPin className="w-4 h-4 text-teal-600 mr-1 flex-shrink-0" />
                      <span className="truncate">{bus.routeOrigin}</span>
                      <ChevronRight className="w-3 h-3 mx-1 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{bus.routeDestination}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 text-gray-500 mr-1 flex-shrink-0" />
                      Departs at <span className="font-medium ml-1">{bus.departureTime}</span>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="md:col-span-3 flex flex-col justify-center">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span className="font-medium">Passengers</span>
                      <span className="font-semibold">
                        {bus.passengerCount} / {bus.totalSeats} seats
                      </span>
                    </div>
                    <Progress 
                      value={bus.totalSeats ? Math.round((bus.passengerCount / bus.totalSeats) * 100) : 0}
                      className={`h-2 ${
                        bus.hasDeparted 
                          ? "bg-gray-400" 
                          : bus.hasPassengers 
                            ? "bg-teal-500"
                            : "bg-gray-300"
                      }`}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {bus.bookingCount} {bus.bookingCount === 1 ? 'booking' : 'bookings'}
                      </span>
                      {bus.hasDeparted ? (
                        <Badge variant="destructive" className="text-xs">
                          Departed
                        </Badge>
                      ) : bus.hasPassengers ? (
                        <Badge variant="default" className="bg-teal-100 text-teal-800 hover:bg-teal-200 text-xs">
                          Has Passengers
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No Passengers
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Revenue & Actions */}
                  <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start md:items-end lg:items-center gap-3">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Revenue</div>
                      <div className="text-sm font-bold text-teal-700">
                        BWP {(bus.revenue ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={bus.hasPassengers ? "default" : "outline"}
                        size="sm" 
                        className={cn(
                          "h-9 flex items-center",
                          bus.hasPassengers 
                            ? "bg-teal-600 text-white hover:bg-teal-700" 
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => viewManifest(bus.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View {bus.hasPassengers && `(${bus.passengerCount})`}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 text-gray-500 hover:bg-teal-50 hover:text-teal-700 flex items-center justify-center"
                        onClick={() => downloadManifest(bus.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className={`px-6 py-2 text-xs font-medium border-t flex items-center ${
                  bus.status === "Active" 
                    ? "text-teal-800 bg-teal-50 border-teal-100" 
                    : "text-gray-600 bg-gray-100 border-gray-200"
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    bus.status === "Active" ? "bg-teal-500" : "bg-gray-400"
                  }`}></span>
                  {bus.status} • Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}