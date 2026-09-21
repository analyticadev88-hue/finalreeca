"use client";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Booking, SearchData, BoardingPoint } from "@/lib/types";
import { boardingPoints } from "@/lib/data";
import SeatSelection from "./booking/seatselection";
import InquirySidebar from "@/components/InquirySidebar";
import BusSchedules from "./booking/busschedule";
import PassengerPassengerDetailsForm from "./booking/passengerdetails/page";
import HireBusModal from "./booking/hirebusmodal";
import { User, Menu } from "lucide-react";
import BookingForm from "@/components/bookingform";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturedRoutes from "@/components/landing/FeaturedRoutes";
import ServicesSection from "@/components/landing/ServicesSection";
import LandingFooter from "@/components/landing/LandingFooter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import PassengerDetailsForm from "./booking/passengerdetails/page";

interface PassengerGroup {
  primarySeat: string;
  companionSeat?: string;
  isNeighbourFree: boolean;
}

export default function BookingApp() {
  const [currentStep, setCurrentStep] = useState<
    | "search"
    | "schedules"
    | "departure-seats"
    | "return-schedules"
    | "return-seats"
    | "passenger-details"
  >("search");

  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [selectedDepartureBus, setSelectedDepartureBus] = useState<any>(null);
  const [selectedReturnBus, setSelectedReturnBus] = useState<any>(null);
  const [selectedDepartureSeats, setSelectedDepartureSeats] = useState<string[]>([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [showInquirySidebar, setShowInquirySidebar] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [agent, setAgent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [consultant, setConsultant] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isReturnTripSelection, setIsReturnTripSelection] = useState(false);
  const [departureNeighbourFree, setDepartureNeighbourFree] = useState(false);
  const [returnNeighbourFree, setReturnNeighbourFree] = useState(false);
  const [departurePassengerGroups, setDeparturePassengerGroups] = useState<PassengerGroup[]>([]);
  const [returnPassengerGroups, setReturnPassengerGroups] = useState<PassengerGroup[]>([]);

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    const d = date instanceof Date ? date : parseDate(date);
    return !isNaN(d.getTime());
  };

  const toDateObj = (date: any): Date => {
    if (date instanceof Date) return date;
    return parseDate(date);
  };

  const isAdjacent = (seat1: string | undefined, seat2: string | undefined) => {
    if (!seat1 || !seat2) return false;
    const row1 = seat1.charAt(0);
    const row2 = seat2.charAt(0);
    const pos1 = seat1.charAt(1);
    const pos2 = seat2.charAt(1);

    return (
      row1 === row2 &&
      ((pos1 === "A" && pos2 === "B") || (pos1 === "C" && pos2 === "D"))
    );
  };

  const generatePassengerGroups = (seats: string[], neighbourFree: boolean): PassengerGroup[] => {
    const groups: PassengerGroup[] = [];
    const selectedSeatsCopy = [...seats];

    for (let i = 0; i < selectedSeatsCopy.length; i++) {
      const currentSeat = selectedSeatsCopy[i];
      const nextSeat = selectedSeatsCopy[i + 1];

      if (neighbourFree && isAdjacent(currentSeat, nextSeat)) {
        groups.push({
          primarySeat: currentSeat,
          companionSeat: nextSeat,
          isNeighbourFree: true,
        });
        i++;
      } else {
        groups.push({
          primarySeat: currentSeat,
          isNeighbourFree: false,
        });
      }
    }

    return groups;
  };

  const handleSearch = (data: {
    from: string;
    to: string;
    date: any;
    returnDate?: any;
    seats: number;
  }) => {
    const departureDate = toDateObj(data.date);
    const returnDate = data.returnDate ? toDateObj(data.returnDate) : null;
    if (!isValidDate(departureDate)) {
      alert("Please select a valid departure date");
      return;
    }
    if (data.returnDate && !isValidDate(returnDate)) {
      alert("Please select a valid return date");
      return;
    }
    setSearchData({
      from: data.from,
      to: data.to,
      departureDate,
      returnDate,
      seats: data.seats,
      isReturn: !!data.returnDate,
    });
    setCurrentStep("schedules");
  };

  const handleSelectBus = (bus: any, isReturnTrip = false) => {
    if (isReturnTrip) {
      setSelectedReturnBus(bus);
      if (bus.isRequest) {
        setShowInquirySidebar(true);
      } else {
        setCurrentStep("return-seats");
      }
    } else {
      setSelectedDepartureBus(bus);
      if (bus.isRequest) {
        setShowInquirySidebar(true);
      } else {
        setCurrentStep("departure-seats");
      }
    }
  };

  const handleSeatSelect = (seatId: string, isReturnTrip = false, neighbourFree = false) => {
    if (isReturnTrip) {
      setSelectedReturnSeats((prev) => {
        const newSeats = prev.includes(seatId)
          ? prev.filter((id) => id !== seatId)
          : [...prev, seatId];
        setReturnPassengerGroups(generatePassengerGroups(newSeats, returnNeighbourFree));
        return newSeats;
      });
    } else {
      setSelectedDepartureSeats((prev) => {
        const newSeats = prev.includes(seatId)
          ? prev.filter((id) => id !== seatId)
          : [...prev, seatId];
        setDeparturePassengerGroups(generatePassengerGroups(newSeats, departureNeighbourFree));
        return newSeats;
      });
    }
  };

  const handleProceedToPassengerDetails = () => {
    if (searchData?.isReturn && selectedReturnSeats.length === 0) {
      setIsReturnTripSelection(true);
      setCurrentStep("return-schedules");
    } else {
      setCurrentStep("passenger-details");
    }
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setBookingComplete(true);
  };

  const handleInquiryClose = () => {
    setShowInquirySidebar(false);
  };

  const handleLogout = async () => {
    await fetch("/api/agent/logout", {
      method: "POST",
      credentials: "include",
    });
    await fetch("/api/consultant/logout", {
      method: "POST",
      credentials: "include",
    });
    setAgent(null);
    setConsultant(null);
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchAuthStatus = () => {
      fetch("/api/auth/status")
        .then(async (res) => {
          if (res.ok) {
            const { agent: agentData, consultant: consultantData } = await res.json();
            setAgent(agentData ?? null);
            setConsultant(consultantData ?? null);
          }
        })
        .catch(() => {
          setAgent(null);
          setConsultant(null);
        });
    };
    fetchAuthStatus();
    window.addEventListener("focus", fetchAuthStatus);
    return () => window.removeEventListener("focus", fetchAuthStatus);
  }, []);

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-teal-50">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-xl shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-teal-900">
            {selectedDepartureBus?.isRequest
              ? "Request Submitted!"
              : "Booking Confirmed!"}
          </h2>
          <p className="text-amber-700 mb-6">
            {selectedDepartureBus?.isRequest
              ? "Your tour vehicle request has been submitted. We'll contact you within 2 hours."
              : "Your Reeca Travel bus ticket has been successfully booked"}
          </p>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg mb-6 border border-teal-200">
            <div className="text-sm text-teal-700">
              {selectedDepartureBus?.isRequest
                ? "Request Reference"
                : "Booking Reference"}
            </div>
            <div className="text-xl font-bold text-teal-900">
              #RT{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Book Another Trip
            </Button>
          </div>
        </div>
      </div>
    );
  }



  const NavLinks = () => (
    <>
      <a
        href="/"
        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        Home
      </a>
      <a
        href="#about"
        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        About Us
      </a>
      <a
        href="#routes"
        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        Routes
      </a>
      <a
        href="#services"
        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        Services
      </a>
      <a
        href="#contact"
        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        Contact Us
      </a>
    </>
  );

  if (currentStep === "search") {
    return (
      <div className="min-h-screen bg-slate-100">
        {agent && (
          <div className="w-full bg-amber-100 border-b border-amber-200 py-2 px-4 flex items-center justify-between">
            <span className="text-amber-900 font-semibold text-sm md:text-base">
              Booking as Agent: {agent.name}
            </span>
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full"
              onClick={async () => {
                await handleLogout();
                window.location.href = "/agent/dashboard";
              }}
            >
              Leave Booking
            </Button>
          </div>
        )}
        {!agent && consultant && (
          <div className="w-full bg-amber-100 border-b border-amber-200 py-2 px-4 flex items-center justify-between">
            <span className="text-amber-900 font-semibold text-sm md:text-base">
              Booking as Consultant: {consultant.name}
            </span>
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full"
              onClick={async () => {
                await handleLogout();
                window.location.href = "/consultant/dashboard";
              }}
            >
              Leave Booking
            </Button>
          </div>
        )}

        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Travel"
                  width={160}
                  height={64}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </a>

              <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
                <NavLinks />
              </nav>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-8">
                      <NavLinks />
                      <hr className="border-gray-200" />
                      <a
                        href="/agent/auth"
                        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                      >
                        Agent Portal
                      </a>
                      <a
                        href="/consultant/auth"
                        className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                      >
                        Consultant Portal
                      </a>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-10 px-5 rounded-full font-medium bg-[#FFD700] hover:bg-[#e6c200] text-gray-900 border-0 shadow-sm">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = "/agent/auth"}>
                        Agent Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/consultant/auth"}>
                        Consultant Portal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main>
          <HeroSection>
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 p-4 md:p-6">
              <BookingForm
                onSearch={handleSearch}
                agentInfo={agent}
                onHireBus={() => setShowHireModal(true)}
              />
            </div>
          </HeroSection>

          <AboutSection />
          <FeaturedRoutes />
          <ServicesSection onHireBus={() => setShowHireModal(true)} />
        </main>

        <LandingFooter />

        {showHireModal && (
          <HireBusModal
            onClose={() => setShowHireModal(false)}
            onSubmit={async (formData) => {
              await fetch("/api/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
              });
              setShowHireModal(false);
              alert("Your hire inquiry has been submitted. We'll contact you soon!");
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      {agent && (
        <div className="w-full bg-yellow-200 border-b border-yellow-300 py-2 px-4 flex items-center justify-between">
          <span className="text-yellow-800 font-semibold text-lg">
            Booking as Agent: {agent.name}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-teal-600 text-white"
              onClick={() => (window.location.href = "/agent/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
      {!agent && consultant && (
        <div className="w-full bg-yellow-200 border-b border-yellow-300 py-2 px-4 flex items-center justify-between">
          <span className="text-yellow-800 font-semibold text-lg">
            Booking as Consultant: {consultant.name}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-teal-600 text-white"
              onClick={() => (window.location.href = "/consultant/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="bg-white rounded-lg flex items-center justify-center p-1"
                style={{ width: 180, height: 72 }}
              >
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Travel"
                  width={900}
                  height={360}
                  style={{ width: "100%", height: "auto" }}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {currentStep === "schedules" && searchData && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("search")}
              className="mb-6 text-teal-600 hover:bg-teal-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Search
            </Button>
            <BusSchedules
              searchData={searchData}
              onSelectBus={(bus) => handleSelectBus(bus)}
              boardingPoints={boardingPoints}
              isReturnTrip={false}
            />
          </div>
        )}
        {currentStep === "departure-seats" && selectedDepartureBus && searchData && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("schedules")}
              className="mb-6 text-teal-600 hover:bg-teal-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Schedule
            </Button>
            <SeatSelection
              selectedBus={selectedDepartureBus}
              onSeatSelect={(seatId) => handleSeatSelect(seatId, false, departureNeighbourFree)}
              selectedSeats={selectedDepartureSeats}
              onProceed={handleProceedToPassengerDetails}
              searchData={searchData}
              isReturnTrip={false}
              travelNeighbourFree={departureNeighbourFree}
              setTravelNeighbourFree={setDepartureNeighbourFree}
            />
          </div>
        )}
        {currentStep === "return-schedules" && searchData && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("departure-seats")}
              className="mb-6 text-teal-600 hover:bg-teal-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Departure Seats
            </Button>
            <BusSchedules
              searchData={{
                ...searchData,
                from: searchData.to,
                to: searchData.from,
                departureDate: searchData.returnDate || new Date(),
                returnDate: null,
              }}
              onSelectBus={(bus) => handleSelectBus(bus, true)}
              boardingPoints={boardingPoints}
              isReturnTrip={true}
            />
          </div>
        )}
        {currentStep === "return-seats" && selectedReturnBus && searchData && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("return-schedules")}
              className="mb-6 text-teal-600 hover:bg-teal-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Return Schedules
            </Button>
            <SeatSelection
              selectedBus={selectedReturnBus}
              onSeatSelect={(seatId) => handleSeatSelect(seatId, true, returnNeighbourFree)}
              selectedSeats={selectedReturnSeats}
              onProceed={handleProceedToPassengerDetails}
              searchData={{
                ...searchData,
                from: searchData.to,
                to: searchData.from,
                departureDate: searchData.returnDate || new Date(),
              }}
              isReturnTrip={true}
              maxSelectableSeats={selectedDepartureSeats.length}
              travelNeighbourFree={returnNeighbourFree}
              setTravelNeighbourFree={setReturnNeighbourFree}
            />
          </div>
        )}
        {currentStep === "passenger-details" && searchData && (
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedReturnBus) {
                  setCurrentStep("return-seats");
                } else if (searchData.isReturn && !selectedReturnBus) {
                  setCurrentStep("return-schedules");
                } else {
                  setCurrentStep("departure-seats");
                }
              }}
              className="mb-6 text-teal-600 hover:bg-teal-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Seat Selection
            </Button>
            <PassengerDetailsForm
              departureBus={selectedDepartureBus}
              returnBus={selectedReturnBus}
              departureSeats={selectedDepartureSeats}
              returnSeats={selectedReturnSeats}
              passengerGroups={[...departurePassengerGroups, ...returnPassengerGroups]}
              searchData={searchData}
              boardingPoints={boardingPoints}
              onProceedToPayment={handleProceedToPayment}
              showPayment={showPayment}
              setShowPayment={setShowPayment}
              onPaymentComplete={handlePaymentComplete}
              departureNeighbourFree={departureNeighbourFree}
              returnNeighbourFree={returnNeighbourFree}
            />
          </div>
        )}
      </main>

      <InquirySidebar
        isOpen={showInquirySidebar}
        onClose={handleInquiryClose}
        bus={selectedDepartureBus || selectedReturnBus}
      />
    </div>
  );
}
