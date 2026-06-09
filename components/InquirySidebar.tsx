"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle2, AlertTriangle, X, Bus } from "lucide-react";
import { format } from "date-fns";

interface InquirySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bus: any;
}

export default function InquirySidebar({ isOpen, onClose, bus }: InquirySidebarProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    passengers: 1,
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const payload = {
        companyName: formData.companyName || "Individual",
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        passengers: Number(formData.passengers),
        date: bus?.departureDate
          ? format(new Date(bus.departureDate), "yyyy-MM-dd")
          : "",
        time: bus?.departureTime || "",
        origin: bus?.routeOrigin || bus?.searchData?.from || "",
        destination: bus?.routeDestination || bus?.searchData?.to || "",
        returnDate: "",
        specialRequests: formData.specialRequests,
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitStatus("success");
        setFormData({
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          passengers: 1,
          specialRequests: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const routeLabel = bus
    ? `${bus.routeOrigin || bus.searchData?.from || ""} → ${bus.routeDestination || bus.searchData?.to || ""}`
    : "";
  const dateLabel = bus?.departureDate
    ? format(new Date(bus.departureDate), "PPP")
    : "";
  const timeLabel = bus?.departureTime || "";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-teal-800">
            <Bus className="w-5 h-5" />
            Bus Full — Send Inquiry
          </SheetTitle>
          <SheetDescription>
            This bus is fully booked. Submit an inquiry and we will get back to
            you shortly.
          </SheetDescription>
        </SheetHeader>

        {submitStatus === "success" ? (
          <div className="mt-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800">
              Inquiry Submitted!
            </h3>
            <p className="text-gray-600">
              Thank you for reaching out. Our team will contact you within 2
              hours.
            </p>
            <Button
              onClick={onClose}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Journey summary */}
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-100 text-sm space-y-1">
              <div className="font-semibold text-teal-900">Journey</div>
              <div className="text-teal-700">{routeLabel}</div>
              <div className="text-teal-700">
                {dateLabel} at {timeLabel}
              </div>
            </div>

            <div>
              <Label htmlFor="inqContactPerson" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <Input
                id="inqContactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                required
                className="mt-1"
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="inqCompanyName" className="text-sm font-medium text-gray-700">
                Company Name (Optional)
              </Label>
              <Input
                id="inqCompanyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="mt-1"
                placeholder="Company or organization"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="inqEmail" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="inqEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  className="mt-1"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <Label htmlFor="inqPhone" className="text-sm font-medium text-gray-700">
                  Phone *
                </Label>
                <Input
                  id="inqPhone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  className="mt-1"
                  placeholder="+267 XX XXX XXX"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="inqPassengers" className="text-sm font-medium text-gray-700">
                Passengers *
              </Label>
              <Select
                value={formData.passengers.toString()}
                onValueChange={(value) => handleChange("passengers", Number(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "Passenger" : "Passengers"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inqSpecialRequests" className="text-sm font-medium text-gray-700">
                Message / Special Requests
              </Label>
              <Textarea
                id="inqSpecialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleChange("specialRequests", e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Any additional details..."
              />
            </div>

            {submitStatus === "error" && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
