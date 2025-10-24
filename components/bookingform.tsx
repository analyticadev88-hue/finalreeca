// BookingForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  onSearch: (data: any) => void;
  agentInfo?: any;
  onHireBus?: () => void;
}

export default function BookingForm({ onSearch, agentInfo, onHireBus }: BookingFormProps) {
  const [fromLocation, setFromLocation] = useState("Gaborone");
  const [toLocation, setToLocation] = useState("OR Tambo Airport");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [totalSeats, setTotalSeats] = useState("1");

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700">From</Label>
          <Select value={fromLocation} onValueChange={setFromLocation}>
            <SelectTrigger className="h-12 border border-gray-300 bg-white">
              <SelectValue placeholder="Select origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gaborone">Gaborone</SelectItem>
              <SelectItem value="OR Tambo Airport">OR Tambo Airport</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">To</Label>
          <Select value={toLocation} onValueChange={setToLocation}>
            <SelectTrigger className="h-12 border border-gray-300 bg-white">
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OR Tambo Airport">OR Tambo Airport</SelectItem>
              <SelectItem value="Gaborone">Gaborone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">Departure Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 w-full justify-start text-left font-normal border border-gray-300 bg-white",
                  !departureDate && "text-gray-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {departureDate ? format(departureDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-gray-700">Return Date</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="returnTrip"
                checked={isReturnTrip}
                onCheckedChange={(checked) => setIsReturnTrip(!!checked)}
                className="border-gray-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <Label htmlFor="returnTrip" className="text-sm font-normal">
                Return
              </Label>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 w-full justify-start text-left font-normal border border-gray-300 bg-white",
                  !returnDate && "text-gray-500",
                  !isReturnTrip && "opacity-50 cursor-not-allowed"
                )}
                disabled={!isReturnTrip}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="space-y-2">
            <Label className="text-gray-700">Passengers</Label>
            <Select value={totalSeats} onValueChange={setTotalSeats}>
              <SelectTrigger className="h-12 border border-gray-300 bg-white w-24">
                <SelectValue placeholder="1" />
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
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {onHireBus && (
            <Button
              onClick={onHireBus}
              variant="outline"
              className="w-full md:w-auto h-12 font-medium"
              style={{
                borderColor: "#FFD700",
                color: "#FFD700"
              }}
            >
              Hire a Coach
            </Button>
          )}
          <Button
            onClick={handleSearch}
            className="w-full md:w-auto h-12 font-medium"
            style={{
              backgroundColor: "#FFD700",
              color: "#fff",
              borderColor: "rgb(243,193,39)"
            }}
          >
            Search Buses
          </Button>
        </div>
      </div>

      {agentInfo && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-amber-800">
            Booking as agent: <span className="font-semibold">{agentInfo.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}