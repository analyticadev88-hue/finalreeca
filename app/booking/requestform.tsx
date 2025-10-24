// src/components/booking/RequestForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, UserPlus } from "lucide-react";
import { format } from "date-fns";

interface RequestFormProps {
  selectedBus: any;
  onSubmitRequest: () => void;
}

export default function RequestForm({ selectedBus, onSubmitRequest }: RequestFormProps) {
  const [passengerDetails, setPassengerDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    passengers: 1,
    specialRequests: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRequest();
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Request Tour Vehicle</h3>
          <p className="text-gray-600">Our regular bus is full, but we can arrange a tour vehicle for your journey.</p>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h4 className="font-semibold text-teal-900 mb-2">Journey Details</h4>
            <div className="text-sm space-y-1 text-teal-700">
              <div>
                Route: {selectedBus.searchData.from} → {selectedBus.searchData.to}
              </div>
              <div>Date: {format(selectedBus.searchData.departureDate, "PPP")}</div>
              <div>Time: {selectedBus.departureTime}</div>
              <div>Vehicle: Tour Bus (Premium Comfort)</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={passengerDetails.fullName}
                  onChange={(e) => setPassengerDetails((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 border-gray-200 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={passengerDetails.email}
                  onChange={(e) => setPassengerDetails((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 border-gray-200 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Contact Number *
                </Label>
                <Input
                  id="phone"
                  value={passengerDetails.phone}
                  onChange={(e) => setPassengerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+267 XX XXX XXX"
                  className="mt-1 border-gray-200 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="passengers" className="text-sm font-medium text-gray-700">
                  Number of Passengers *
                </Label>
                <Select
                  value={passengerDetails.passengers.toString()}
                  onValueChange={(value) =>
                    setPassengerDetails((prev) => ({ ...prev, passengers: Number.parseInt(value) }))
                  }
                >
                  <SelectTrigger className="mt-1 border-gray-200 focus:border-teal-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Passenger" : "Passengers"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-700">
                Special Requests (Optional)
              </Label>
              <Textarea
                id="specialRequests"
                value={passengerDetails.specialRequests}
                onChange={(e) => setPassengerDetails((prev) => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
                className="mt-1 border-gray-200 focus:border-teal-500"
                rows={3}
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Important Information</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Tour vehicle booking is subject to availability</li>
                <li>• We will contact you within 2 hours to confirm</li>
                <li>• Same premium service and safety standards</li>
                <li>• Fare remains P500 per passenger</li>
              </ul>
            </div>

            <Button type="submit" className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              <UserPlus className="w-4 h-4 mr-2" />
              SUBMIT REQUEST
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
