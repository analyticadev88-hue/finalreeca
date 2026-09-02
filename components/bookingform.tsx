// BookingForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  onSearch: (data: any) => void;
  agentInfo?: any;
  onHireBus?: () => void;
}

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  active: boolean;
}

export default function BookingForm({ onSearch, agentInfo, onHireBus }: BookingFormProps) {
  const [fromLocation, setFromLocation] = useState("Gaborone");
  const [toLocation, setToLocation] = useState("");  // Start empty - let user choose
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [totalSeats, setTotalSeats] = useState("1");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Default hardcoded routes (always available)
  const defaultRoutes: Route[] = [
    { id: 'default-1', name: 'Gaborone to OR Tambo Airport', origin: 'Gaborone', destination: 'OR Tambo Airport', active: true },
    { id: 'default-2', name: 'OR Tambo Airport to Gaborone', origin: 'OR Tambo Airport', destination: 'Gaborone', active: true },
    { id: 'default-3', name: 'Gaborone to Rustenburg', origin: 'Gaborone', destination: 'Rustenburg', active: true },
    { id: 'default-4', name: 'Rustenburg to Gaborone', origin: 'Rustenburg', destination: 'Gaborone', active: true },
    { id: 'default-5', name: 'Gaborone to Maun', origin: 'Gaborone', destination: 'Maun', active: true },
    { id: 'default-6', name: 'Maun to Gaborone', origin: 'Maun', destination: 'Gaborone', active: true },
  ];

  // Fetch available routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/admin/routes');
        if (response.ok) {
          const data = await response.json();
          // Combine dynamic routes with defaults, removing duplicates
          const combinedRoutes = [...defaultRoutes, ...data];
          const uniqueRoutes = combinedRoutes.filter((route, index, self) =>
            index === self.findIndex(r => r.name.toLowerCase() === route.name.toLowerCase())
          );
          setRoutes(uniqueRoutes);
        } else {
          // Use only defaults if API fails
          setRoutes(defaultRoutes);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
        // Keep default hardcoded routes as fallback
        setRoutes(defaultRoutes);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, []);

  // Get unique origin cities (departure points)
  const originCities = Array.from(new Set(routes.map(r => r.origin))).sort();

  // Get destination cities based on selected origin
  const destinationCities = Array.from(
    new Set(
      routes
        .filter(r => r.origin.toLowerCase() === fromLocation.toLowerCase())
        .map(r => r.destination)
    )
  ).sort();

  // Auto-update destination only if it becomes invalid (due to route changes)
  // But don't auto-assign on initial load or when user hasn't selected yet
  useEffect(() => {
    if (toLocation && !destinationCities.includes(toLocation) && destinationCities.length > 0) {
      // Only auto-update if they had a selection that's no longer valid
      setToLocation("");  // Reset to let user choose new destination
    }
  }, [destinationCities]);

  const getToday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDateBeforeToday = (date: Date) => {
    const today = getToday();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return checkDate < today;
  };

  const handleSearch = () => {
    if (!fromLocation) {
      alert("Please select a departure location");
      return;
    }
    
    if (!toLocation) {
      alert("Please select a destination");
      return;
    }
    
    if (!departureDate) {
      alert("Please select a departure date");
      return;
    }
    
    if (isReturnTrip && !returnDate) {
      alert("Please select a return date");
      return;
    }

    onSearch({
      from: fromLocation,
      to: toLocation,
      date: departureDate,
      returnDate: isReturnTrip ? returnDate : null,
      seats: Number.parseInt(totalSeats),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-0">
        {/* From */}
        <div className="flex-1 min-w-0 px-0 lg:px-4 py-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
            From
          </Label>
          <Select value={fromLocation} onValueChange={setFromLocation} disabled={loadingRoutes}>
            <SelectTrigger className="h-12 border-0 bg-transparent shadow-none p-0 text-base font-medium text-gray-900 focus:ring-0 [&>svg]:hidden">
              <div className="flex items-center gap-2 w-full">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder={loadingRoutes ? "Loading..." : "Select origin"} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {originCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden lg:block w-px h-14 bg-gray-200 self-center" />

        {/* To */}
        <div className="flex-1 min-w-0 px-0 lg:px-4 py-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
            To
          </Label>
          <Select value={toLocation} onValueChange={setToLocation} disabled={loadingRoutes || destinationCities.length === 0}>
            <SelectTrigger className="h-12 border-0 bg-transparent shadow-none p-0 text-base font-medium text-gray-900 focus:ring-0 [&>svg]:hidden">
              <div className="flex items-center gap-2 w-full">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder={loadingRoutes ? "Loading..." : "Select destination"} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {destinationCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden lg:block w-px h-14 bg-gray-200 self-center" />

        {/* Departure Date */}
        <div className="flex-1 min-w-0 px-0 lg:px-4 py-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
            Departure
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-12 w-full justify-start p-0 text-left font-normal hover:bg-transparent focus-visible:ring-0",
                  !departureDate && "text-gray-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                {departureDate ? (
                  <span className="text-base font-medium text-gray-900">
                    {format(departureDate, "dd MMM yyyy")}
                  </span>
                ) : (
                  <span className="text-base">Pick date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                initialFocus
                disabled={isDateBeforeToday}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="hidden lg:block w-px h-14 bg-gray-200 self-center" />

        {/* Return Date */}
        <div className="flex-1 min-w-0 px-0 lg:px-4 py-1">
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Return
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="returnTrip"
                checked={isReturnTrip}
                onCheckedChange={(checked) => setIsReturnTrip(!!checked)}
                className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
              />
              <Label htmlFor="returnTrip" className="text-xs font-medium text-gray-500">
                Return
              </Label>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-12 w-full justify-start p-0 text-left font-normal hover:bg-transparent focus-visible:ring-0",
                  !returnDate && "text-gray-500",
                  !isReturnTrip && "opacity-50 cursor-not-allowed"
                )}
                disabled={!isReturnTrip}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                {returnDate ? (
                  <span className="text-base font-medium text-gray-900">
                    {format(returnDate, "dd MMM yyyy")}
                  </span>
                ) : (
                  <span className="text-base">Pick date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                initialFocus
                disabled={(date) => {
                  const minDate = departureDate || getToday();
                  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  const minDateCheck = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                  return checkDate < minDateCheck;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="hidden lg:block w-px h-14 bg-gray-200 self-center" />

        {/* Passengers */}
        <div className="px-0 lg:px-4 py-1 w-full lg:w-28">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
            Passengers
          </Label>
          <Select value={totalSeats} onValueChange={setTotalSeats}>
            <SelectTrigger className="h-12 border-0 bg-transparent shadow-none p-0 text-base font-medium text-gray-900 focus:ring-0 [&>svg]:hidden">
              <div className="flex items-center gap-2 w-full">
                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder="1" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {[...Array(60)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 px-0 lg:pl-4 py-1 w-full lg:w-auto">
          {onHireBus && (
            <Button
              onClick={onHireBus}
              variant="outline"
              className="h-12 px-5 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              <Bus className="w-4 h-4 mr-2" />
              Hire a Coach
            </Button>
          )}
          <Button
            onClick={handleSearch}
            className="h-12 px-8 rounded-full bg-[#FFD700] hover:bg-[#e6c200] text-gray-900 font-medium border-0 shadow-sm"
          >
            Book Now
          </Button>
        </div>
      </div>

      {agentInfo && (
        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-amber-800 text-sm">
            Booking as agent: <span className="font-semibold">{agentInfo.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
