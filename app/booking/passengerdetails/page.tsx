"use client";
import React, { useState, useEffect } from "react";
import { useToast, toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Luggage,
  ShoppingBag,
  Shield,
  Info,
  Gift,
  UserPlus,
} from "lucide-react";
import { SearchData, BoardingPoint } from "@/lib/types";
import { format } from "date-fns";
import { PolicyModal } from "@/components/PolicyModal";
import PaymentGateway from "../paymentgateway";

type PassengerType = "adult" | "child";

interface Passenger {
  type: PassengerType;
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  seatNumber: string;
  isReturn: boolean;
  hasInfant?: boolean;
  infantName?: string;
  infantPassportNumber?: string;
  infantBirthdate?: string;
  birthdate: string;
  passportNumber: string;
  phone?: string;
  phoneCountryCode?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinPhoneCountryCode?: string;
  isNeighbourFreeSeat?: boolean;
}

interface PassengerGroup {
  primarySeat: string;
  companionSeat?: string;
  isNeighbourFree: boolean;
}

interface ContactDetails {
  name: string;
  email: string;
  mobile: string;
  mobileCountryCode?: string;
  alternateMobile: string;
  idType: string;
  idNumber: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  phoneCountryCode?: string;
}

interface SectionState {
  passengers: boolean;
  contact: boolean;
  emergency: boolean;
  points: boolean;
  addons: boolean;
}

interface PassengerDetailsFormProps {
  departureBus: any;
  returnBus: any;
  departureSeats: string[];
  returnSeats: string[];
  passengerGroups: PassengerGroup[];
  searchData: SearchData;
  boardingPoints: Record<string, BoardingPoint[]>;
  onProceedToPayment: () => void;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  onPaymentComplete: () => void;
  departureNeighbourFree: boolean;
  returnNeighbourFree: boolean;
  reservationToken?: string;
  initialPaymentMode?: string;
  allowedPaymentModes?: string[];
}

const ADDONS = [
  {
    key: "extraBaggage",
    label: "Extra Baggage",
    description: "Additional baggage allowance for your trip.",
    price: 300,
    icon: <Luggage className="h-5 w-5 text-[#ffc721]" />,
    showOnReturn: true,
  },
  {
    key: "wimpyMeal1",
    label: "Wimpy Meal for 1",
    description: "Enjoy a Wimpy meal for 1 person.",
    price: 67,
    icon: <ShoppingBag className="h-5 w-5 text-[#ffc721]" />,
    image: "/images/mealfor1.jpeg",
    showOnReturn: false,
  },
  {
    key: "wimpyMeal2",
    label: "Wimpy Meal for 2",
    description: "Enjoy a combo Wimpy meal shared for 2 people.",
    price: 137,
    icon: <ShoppingBag className="h-5 w-5 text-[#ffc721]" />,
    images: ["/images/mealfor2burger.jpeg", "/images/mealfor2doubleup.jpeg"],
    showOnReturn: false,
  },
  {
    key: "travelInsurance",
    label: "Add Travel Insurance",
    description: "Comprehensive travel insurance coverage.",
    price: 450,
    icon: <Shield className="h-5 w-5 text-[#ffc721]" />,
    showOnReturn: true,
  },
];

const areSeatsAdjacent = (seat1: string, seat2: string): boolean => {
  if (!seat1 || !seat2 || seat1.length < 2 || seat2.length < 2) return false;
  const row1 = parseInt(seat1.slice(0, -1));
  const pos1 = seat1.slice(-1);
  const row2 = parseInt(seat2.slice(0, -1));
  const pos2 = seat2.slice(-1);
  if (row1 !== row2) return false;
  return (
    (pos1 === "A" && pos2 === "B") ||
    (pos1 === "B" && pos2 === "A") ||
    (pos1 === "C" && pos2 === "D") ||
    (pos1 === "D" && pos2 === "C")
  );
};

const groupSeatsForNeighbourFree = (seats: string[]) => {
  const primary: string[] = [];
  const companion: string[] = [];
  const used = new Set<string>();
  for (let i = 0; i < seats.length; i++) {
    if (used.has(seats[i])) continue;
    const seat = seats[i];
    const adj = seats.find((s) => s !== seat && areSeatsAdjacent(seat, s) && !used.has(s));
    if (adj) {
      primary.push(seat);
      companion.push(adj);
      used.add(seat);
      used.add(adj);
    } else {
      primary.push(seat);
      used.add(seat);
    }
  }
  return { primary, companion };
};

function generateOrderId() {
  return `RT${Math.floor(100000 + Math.random() * 900000)}`;
}

const COUNTRY_CODES = [
  { code: "+267", flag: "🇧🇼", name: "Botswana" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  { code: "+260", flag: "🇿🇲", name: "Zambia" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "USA/Canada" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+258", flag: "🇲🇿", name: "Mozambique" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "+420", flag: "🇨🇿", name: "Czechia" },
];

const CountryCodeSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-md px-2 py-1 focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] bg-white text-sm"
      style={{ maxWidth: 100 }}
    >
      {COUNTRY_CODES.map((country) => (
        <option key={country.code} value={country.code}>
          {country.code} ({country.name})
        </option>
      ))}
    </select>
  );
};

const CountryCodeDisplay = ({ value }: { value: string }) => {
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];
  return (
    <div className="border border-gray-300 rounded-md px-2 py-1 bg-white text-sm flex items-center justify-center"
      style={{ maxWidth: 100, minWidth: 80 }}>
      {selectedCountry.code}
    </div>
  );
};

import WhatsAppButton from "@/components/WhatsAppButton";

export default function PassengerDetailsForm({
  departureBus,
  returnBus,
  departureSeats = [],
  returnSeats = [],
  passengerGroups = [],
  searchData = {} as SearchData,
  boardingPoints = {},
  onProceedToPayment,
  showPayment,
  setShowPayment,
  onPaymentComplete,
  departureNeighbourFree,
  returnNeighbourFree,
  reservationToken,
  initialPaymentMode,
  allowedPaymentModes,
}: PassengerDetailsFormProps) {
  const isRoundTrip = !!returnBus;
  const [selectedAddons, setSelectedAddons] = useState<{
    [key: string]: { departure: boolean; return: boolean; departurePref?: string; returnPref?: string };
  }>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const depNF = departureNeighbourFree
    ? groupSeatsForNeighbourFree(departureSeats)
    : { primary: departureSeats, companion: [] };
  const retNF = returnNeighbourFree
    ? groupSeatsForNeighbourFree(returnSeats)
    : { primary: returnSeats, companion: [] };

  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    const dep: Passenger[] = depNF.primary.map((seat) => ({
      id: `departure-${seat}`,
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      seatNumber: seat,
      isReturn: false,
      birthdate: "",
      passportNumber: "",
      hasInfant: false,
      infantBirthdate: "",
      infantName: "",
      infantPassportNumber: "",
      isNeighbourFreeSeat: false,
    }));
    const depComp: Passenger[] = depNF.companion.map((seat) => ({
      id: `departure-${seat}`,
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      seatNumber: seat,
      isReturn: false,
      birthdate: "",
      passportNumber: "",
      hasInfant: false,
      infantBirthdate: "",
      infantName: "",
      infantPassportNumber: "",
      isNeighbourFreeSeat: true,
    }));
    const ret: Passenger[] = retNF.primary.map((seat) => ({
      id: `return-${seat}`,
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      seatNumber: seat,
      isReturn: true,
      birthdate: "",
      passportNumber: "",
      hasInfant: false,
      infantBirthdate: "",
      infantName: "",
      infantPassportNumber: "",
      isNeighbourFreeSeat: false,
    }));
    const retComp: Passenger[] = retNF.companion.map((seat) => ({
      id: `return-${seat}`,
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      seatNumber: seat,
      isReturn: true,
      birthdate: "",
      passportNumber: "",
      hasInfant: false,
      infantBirthdate: "",
      infantName: "",
      infantPassportNumber: "",
      isNeighbourFreeSeat: true,
    }));
    return [...dep, ...depComp, ...ret, ...retComp];
  });

  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: "",
    email: "",
    mobile: "",
    alternateMobile: "",
    idType: "Passport",
    idNumber: "",
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
  });

  const [paymentMode, setPaymentMode] = useState(initialPaymentMode || "Credit Card");
  const [showBankDepositNotice, setShowBankDepositNotice] = useState(false);
  const [consultantDiscountType, setConsultantDiscountType] = useState<string>("none");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showBankDepositLoading, setShowBankDepositLoading] = useState(false);
  const [useFreeVoucher, setUseFreeVoucher] = useState(false);
  const [departureBoardingPoint, setDepartureBoardingPoint] = useState("");
  const [departureDroppingPoint, setDepartureDroppingPoint] = useState("");
  const [returnBoardingPoint, setReturnBoardingPoint] = useState("");
  const [returnDroppingPoint, setReturnDroppingPoint] = useState("");

  const [openSections, setOpenSections] = useState<SectionState>({
    passengers: true,
    contact: true,
    emergency: true,
    points: true,
    addons: true,
  });

  const [agent, setAgent] = useState<{ id: string; name: string; email: string } | null>(
    null
  );
  const [consultant, setConsultant] = useState<{ id: string; name: string; email: string } | null>(
    null
  );
  const [infantFare, setInfantFare] = useState(250);
  const [childFare, setChildFare] = useState(400);
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [voucherToken, setVoucherToken] = useState<string | null>(null);
  const [voucherStatus, setVoucherStatus] = useState<string | null>(null);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [showReservationConflict, setShowReservationConflict] = useState(false);
  const [reservationMessage, setReservationMessage] = useState<string | null>(null);
  const [currentUnavailable, setCurrentUnavailable] = useState<string[]>([]);
  const { toast: makeToast } = useToast();
  const [showVoucherExpiredDialog, setShowVoucherExpiredDialog] = useState(false);

  const requestVoucherAuth = async () => {
    try {
      setIsProcessing(true);
      const bookingPayload = createBookingPayload();
      const res = await fetch("/api/request-voucher-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to request voucher authorization");
      }
      const body = await res.json();
      setVoucherToken(body.token);
      setVoucherStatus("pending");
      setIsWaitingForApproval(true);
      setShowVoucherExpiredDialog(false);
    } catch (err: any) {
      makeToast({ title: "Request failed", description: err?.message || "Failed to request voucher authorization" });
      setIsProcessing(false);
    }
  };

  const getAddonPrice = (key: string, departureOrigin?: string, departureDate?: Date, isAgentBooking?: boolean) => {
    const origin = (departureOrigin || "").toLowerCase().trim();
    
    // Check if Wimpy meal should be free on weekends for non-agents
    if ((key === "wimpyMeal1" || key === "wimpyMeal2") && departureDate && !isAgentBooking) {
      const dayOfWeek = departureDate.getDay();
      // Friday (5), Saturday (6), Sunday (0) - make free for non-agents
      if ([0, 5, 6].includes(dayOfWeek)) {
        return 0; // Free on weekends
      }
    }
    
    switch (key) {
      case "extraBaggage":
        return 300;
      case "wimpyMeal1":
        return 67;
      case "wimpyMeal2":
        return 137;
      case "travelInsurance":
        return 450;
      default:
        return 0;
    }
  };

  const getAddonsTotal = () => {
    let total = 0;
    const departurePayingPassengers = passengers.filter((p) => !p.isReturn && !p.isNeighbourFreeSeat);
    const returnPayingPassengers = passengers.filter((p) => p.isReturn && !p.isNeighbourFreeSeat);
    const isAgentBooking = !!agent;
    const departureDateObj = departureBus?.departureDate ? new Date(departureBus.departureDate) : undefined;
    const returnDateObj = returnBus?.departureDate ? new Date(returnBus.departureDate) : undefined;

    ADDONS.forEach((addon) => {
      const depPrice = getAddonPrice(addon.key, departureBus?.routeOrigin, departureDateObj, isAgentBooking);
      const returnPrice = getAddonPrice(addon.key, returnBus?.routeOrigin, returnDateObj, isAgentBooking);
      
      if (selectedAddons[addon.key]?.departure) {
        if (addon.key === "wimpyMeal2") {
          // Scale by the number of pairs (e.g. 1 meal for 2 people, 2 meals for 4 people)
          const pairs = Math.floor(departurePayingPassengers.length / 2);
          total += depPrice * Math.max(1, pairs); 
        } else {
          total += depPrice * departurePayingPassengers.length;
        }
      }
      if (isRoundTrip && selectedAddons[addon.key]?.return) {
        if (addon.key === "wimpyMeal2") {
          const pairs = Math.floor(returnPayingPassengers.length / 2);
          total += returnPrice * Math.max(1, pairs);
        } else {
          total += returnPrice * returnPayingPassengers.length;
        }
      }
    });
    return total;
  };

  const openOnlySection = (section: keyof SectionState) => {
    setOpenSections((prev) => {
      const newState: SectionState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key as keyof SectionState] = key === section;
      });
      return newState;
    });
  };

  const copyDepartureToReturn = () => {
    const departurePassengers = passengers.filter((p) => !p.isReturn);
    const returnPassengers = passengers.filter((p) => p.isReturn);
    const updatedPassengers = passengers.map((passenger) => {
      if (passenger.isReturn) {
        const index = returnPassengers.findIndex((rp) => rp.id === passenger.id);
        if (index !== -1 && departurePassengers[index]) {
          const departurePassenger = departurePassengers[index];
          return {
            ...passenger,
            type: departurePassenger.type,
            title: departurePassenger.title,
            firstName: departurePassenger.firstName,
            lastName: departurePassenger.lastName,
            passportNumber: departurePassenger.passportNumber,
            birthdate: departurePassenger.birthdate,
            hasInfant: departurePassenger.hasInfant,
            infantName: departurePassenger.infantName,
            infantBirthdate: departurePassenger.infantBirthdate,
            infantPassportNumber: departurePassenger.infantPassportNumber,
            phone: departurePassenger.phone,
            phoneCountryCode: departurePassenger.phoneCountryCode,
            nextOfKinName: departurePassenger.nextOfKinName,
            nextOfKinPhone: departurePassenger.nextOfKinPhone,
            nextOfKinPhoneCountryCode: departurePassenger.nextOfKinPhoneCountryCode,
          };
        }
      }
      return passenger;
    });
    setPassengers(updatedPassengers);
  };

  const departurePricePerSeat = departureBus?.fare || 0;

  const getPassengerFare = (p: Passenger) => {
    if (p.type === "child") return childFare;
    return departurePricePerSeat;
  };

  const infantCount = passengers.filter((p) => {
    if (!p.hasInfant) return false;
    const isPrimaryWithCompanion = passengerGroups.some(
      (g) => g.primarySeat === p.seatNumber && !!g.companionSeat
    );
    return !isPrimaryWithCompanion;
  }).length;
  const infantTotal = infantCount * infantFare;

  let departureTotal = 0;
  let returnTotal = 0;

  if (departureNeighbourFree) {
    departureTotal = depNF.primary.reduce((sum, seat) => {
      const passenger = passengers.find((p) => p.seatNumber === seat && !p.isReturn);
      return sum + (passenger ? 2 * getPassengerFare(passenger) : 0);
    }, 0);
  } else {
    departureTotal = passengers.filter((p) => !p.isReturn).reduce((sum, p) => sum + getPassengerFare(p), 0);
  }

  if (returnNeighbourFree) {
    returnTotal = retNF.primary.reduce((sum, seat) => {
      const passenger = passengers.find((p) => p.seatNumber === seat && p.isReturn);
      return sum + (passenger ? 2 * getPassengerFare(passenger) : 0);
    }, 0);
  } else {
    returnTotal = passengers.filter((p) => p.isReturn).reduce((sum, p) => sum + getPassengerFare(p), 0);
  }

  const baseTotal = departureTotal + returnTotal + infantTotal + getAddonsTotal();

  // FIXED: Improved syncCompanionPassenger function
  const syncCompanionPassenger = (primaryPassenger: Passenger) => {
    const isDepNF = !primaryPassenger.isReturn && departureNeighbourFree;
    const isRetNF = primaryPassenger.isReturn && returnNeighbourFree;

    if ((isDepNF || isRetNF) && !primaryPassenger.isNeighbourFreeSeat) {
      const primarySeats = isDepNF ? depNF.primary : retNF.primary;
      const companionSeats = isDepNF ? depNF.companion : retNF.companion;
      
      const primaryIndex = primarySeats.indexOf(primaryPassenger.seatNumber);

      if (primaryIndex !== -1 && companionSeats[primaryIndex]) {
        const companionSeat = companionSeats[primaryIndex];
        const companionId = `${primaryPassenger.isReturn ? "return" : "departure"}-${companionSeat}`;
        
        setPassengers((prev) =>
          prev.map((p) => {
            if (p.id === companionId) {
              return {
                ...p,
                type: primaryPassenger.type,
                title: primaryPassenger.title,
                firstName: primaryPassenger.firstName,
                lastName: primaryPassenger.lastName,
                passportNumber: primaryPassenger.passportNumber,
                birthdate: primaryPassenger.birthdate,
                phone: primaryPassenger.phone,
                phoneCountryCode: primaryPassenger.phoneCountryCode,
                nextOfKinName: primaryPassenger.nextOfKinName,
                nextOfKinPhone: primaryPassenger.nextOfKinPhone,
                nextOfKinPhoneCountryCode: primaryPassenger.nextOfKinPhoneCountryCode,
                hasInfant: primaryPassenger.hasInfant,
                infantName: primaryPassenger.infantName,
                infantBirthdate: primaryPassenger.infantBirthdate,
                infantPassportNumber: primaryPassenger.infantPassportNumber,
                isNeighbourFreeSeat: true,
              };
            }
            return p;
          })
        );
      }
    }
  };

  useEffect(() => {
    fetch("/api/agent/me")
      .then(async (res) => {
        if (res.ok) {
          const agentData = await res.json();
          setAgent(agentData);
        } else {
          setAgent(null);
        }
      })
      .catch(() => setAgent(null));
  }, []);

  useEffect(() => {
    fetch("/api/consultant/me")
      .then(async (res) => {
        if (res.ok) {
          const consultantData = await res.json();
          setConsultant(consultantData);
        } else {
          setConsultant(null);
        }
      })
      .catch(() => setConsultant(null));
  }, []);

  useEffect(() => {
    fetch("/api/getfareprices")
      .then((res) => res.json())
      .then((data) => {
        setInfantFare(data.infant ?? 250);
        setChildFare(data.child ?? 400);
      });
  }, []);

  useEffect(() => {
    fetch("/api/promotions")
      .then((res) => res.json())
      .then((data) => setPromotions((data.promotions || []).filter((p: any) => p.active)));
  }, []);

  let consultantDiscount = 0;
  if (consultant && consultantDiscountType !== "none") {
    if (consultantDiscountType === "student") {
      consultantDiscount = Math.round(baseTotal * 0.05);
    } else if (consultantDiscountType === "senior") {
      consultantDiscount = Math.round(baseTotal * 0.15);
    } else if (consultantDiscountType === "family") {
      if (passengers.length >= 5) {
        consultantDiscount = Math.round((baseTotal / passengers.length) * 0.2);
      }
    } else if (consultantDiscountType === "group") {
      if (passengers.length >= 10) {
        consultantDiscount = Math.round(baseTotal * 0.1);
      }
    }
  }
  const agentDiscount: number = agent ? Math.round(baseTotal * 0.1) : 0;
  const finalTotal: number = baseTotal - agentDiscount - consultantDiscount;

  const getBoardingPoints = (key: string): BoardingPoint[] => {
    if (!boardingPoints || typeof boardingPoints !== "object") {
      return [{ id: "default", name: "Default", times: [] }];
    }
    const normalizedKey = key.trim().toLowerCase() || "default";
    const points = boardingPoints[normalizedKey];
    if (!points || !Array.isArray(points)) {
      return [
        {
          id: "default",
          name: key.trim(),
          times: [],
        },
      ];
    }
    return points;
  };

  const departureOriginKey = ((departureBus?.routeOrigin || searchData.from || "") as string)
    .toLowerCase()
    .trim() || "default";
  const departureDestinationKey = ((departureBus?.routeDestination || searchData.to || "") as string)
    .toLowerCase()
    .trim() || "default";
  const departureOriginPoints = getBoardingPoints(departureOriginKey);
  const departureDestinationPoints = getBoardingPoints(departureDestinationKey);

  let returnOriginPoints: BoardingPoint[] = [];
  let returnDestinationPoints: BoardingPoint[] = [];

  if (isRoundTrip) {
    const returnOriginKey = ((returnBus?.routeOrigin || searchData.to || "") as string)
      .toLowerCase()
      .trim() || "default";
    const returnDestinationKey = ((returnBus?.routeDestination || searchData.from || "") as string)
      .toLowerCase()
      .trim() || "default";
    returnOriginPoints = getBoardingPoints(returnOriginKey);
    returnDestinationPoints = getBoardingPoints(returnDestinationKey);
  }

  const updatePassenger = (id: string, field: string, value: string | boolean) => {
    setPassengers((prev) => {
      const updated = prev.map((passenger) => {
        if (passenger.id === id) {
          const updatedPassenger = { ...passenger, [field]: value };
          if (!passenger.isNeighbourFreeSeat) {
            setTimeout(() => syncCompanionPassenger(updatedPassenger), 0);
          }
          return updatedPassenger;
        }
        return passenger;
      });
      return updated;
    });
  };

  const handleContactChange = (field: keyof ContactDetails, value: string) => {
    setContactDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmergencyChange = (field: keyof EmergencyContact, value: string) => {
    setEmergencyContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddonChange = (addonKey: string, tripType: "departure" | "return", checked: boolean) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonKey]: {
        ...prev[addonKey] || { departure: false, return: false },
        [tripType]: checked,
      },
    }));
  };

  const handleAddonPreference = (addonKey: string, tripType: "departure" | "return", pref: string) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonKey]: {
        ...prev[addonKey] || { departure: false, return: false },
        [tripType === "departure" ? "departurePref" : "returnPref"]: pref,
      },
    }));
  };

  // FIXED: createBookingPayload - Sends ALL passengers including isNeighbourFreeSeat flag
  const createBookingPayload = () => {
    const passengersForPayload = passengers.map((p) => ({
      firstName: p.firstName.trim() || (p.isNeighbourFreeSeat ? "Passenger" : ""),
      lastName: p.lastName.trim() || (p.isNeighbourFreeSeat ? "Guest" : ""),
      seatNumber: p.seatNumber,
      title: p.title || "Mr",
      isReturn: p.isReturn,
      hasInfant: !!p.hasInfant,
      infantBirthdate: p.infantBirthdate || null,
      type: p.type || "adult",
      birthdate: p.birthdate || null,
      passportNumber: p.passportNumber || (p.isNeighbourFreeSeat ? "TBD" : ""),
      infantName: p.infantName || null,
      infantPassportNumber: p.infantPassportNumber || null,
      phone: p.phone || contactDetails.mobile,
      phoneCountryCode: p.phoneCountryCode || contactDetails.mobileCountryCode || "+267",
      nextOfKinName: p.nextOfKinName || emergencyContact.name,
      nextOfKinPhone: p.nextOfKinPhone || emergencyContact.phone,
      nextOfKinPhoneCountryCode: p.nextOfKinPhoneCountryCode || emergencyContact.phoneCountryCode || "+267",
      // CRITICAL: Send isNeighbourFreeSeat flag to backend
      isNeighbourFreeSeat: p.isNeighbourFreeSeat || false,
    }));

    // Debug logging
    console.log("DEBUG Booking Payload:", {
      seats: { departure: departureSeats.length, return: returnSeats.length },
      passengers: passengersForPayload.length,
      passengerDetails: passengersForPayload.map(p => ({
        seat: p.seatNumber,
        isReturn: p.isReturn,
        isNeighbourFree: p.isNeighbourFreeSeat,
        name: `${p.firstName} ${p.lastName}`,
      })),
    });

  return {
  orderId: generateOrderId(),
  tripId: departureBus?.id,
  totalPrice: finalTotal,
  discountAmount: agentDiscount + consultantDiscount,
  consultantDiscountType,
  selectedSeats: [...departureSeats, ...returnSeats],
  departureSeats: departureSeats,
  returnSeats: returnSeats,
  addons: selectedAddons,
  passengers: passengersForPayload,
  userName: contactDetails.name.trim(),
  userEmail: contactDetails.email.trim(),
  userPhone: contactDetails.mobile,
  boardingPoint: departureBoardingPoint,
  droppingPoint: departureDroppingPoint,
  contactDetails: {
    ...contactDetails,
    mobileCountryCode: contactDetails.mobileCountryCode || "+267",
  },
  emergencyContact: {
    name: emergencyContact.name.trim(),
    phone: emergencyContact.phone,
    phoneCountryCode: emergencyContact.phoneCountryCode || "+267",
  },
  paymentMode,
  returnTripId: returnBus?.id || undefined,              // ✅
  returnBoardingPoint: returnBoardingPoint || undefined, // ✅
  returnDroppingPoint: returnDroppingPoint || undefined, // ✅
  agentId: agent?.id || undefined,                       // ✅
  consultantId: consultant?.id || undefined,             // ✅
  reservationToken: reservationToken || undefined,
  paymentStatus: (paymentMode === 'Bank Deposit' || paymentMode === 'Credit Card' || paymentMode === 'Swipe in Person') ? 'pending' : 
                (paymentMode === 'Reservation Paid' || paymentMode === 'Cash') ? 'paid' : 'pending',
};
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log("[Submit] Request already in progress, skipping duplicate submission");
      return;
    }
    if (paymentMode === "Bank Deposit") {
      setShowBankDepositNotice(true);
      return;
    }

    // Check primary passengers (non-companion seats)
    const primaryPassengers = passengers.filter((p) => !p.isNeighbourFreeSeat);
    if (primaryPassengers.some((p) => !p.firstName.trim() || !p.lastName.trim())) {
      alert("Please provide first and last names for all passengers");
      return;
    }

    if (!contactDetails.name || !contactDetails.email || !contactDetails.mobile) {
      alert("Please provide your name, email and mobile number");
      return;
    }

    if (!emergencyContact.name || !emergencyContact.phone) {
      alert("Please provide emergency contact details");
      return;
    }

    if (!departureBoardingPoint || !departureDroppingPoint) {
      alert("Please select departure boarding and dropping points");
      return;
    }

    if (isRoundTrip && (!returnBoardingPoint || !returnDroppingPoint)) {
      alert("Please select return boarding and dropping points");
      return;
    }

    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    if (
      primaryPassengers.some(
        (p) =>
          (p.type === "child" && !isValidChild(p.birthdate)) ||
          (p.hasInfant && !isValidInfant(p.infantBirthdate || ""))
      )
    ) {
      alert("Children must be 2-11 years old. Infants must be under 2 years old.");
      return;
    }

    onProceedToPayment();
  };

  const handleBankDepositProceed = () => {
    setShowBankDepositNotice(false);
    onProceedToPayment();
  };

  const formatPoint = (point: string) => {
    if (point.trim().toLowerCase() === "or tambo" || point.trim().toLowerCase() === "or tambo airport") {
      return "OR Tambo Airport Bus Terminal";
    }
    return point;
  };

  function isValidChild(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    const now = new Date();
    const age = (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 2 && age < 11;
  }

  function isValidInfant(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    const now = new Date();
    const age = (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 0 && age < 2;
  }

  useEffect(() => {
    if (paymentMode === "Bank Deposit") {
      setShowBankDepositNotice(true);
    } else {
      setShowBankDepositNotice(false);
    }
  }, [paymentMode]);

  useEffect(() => {
    if (!allowedPaymentModes || allowedPaymentModes.length === 0) return;
    if (!allowedPaymentModes.includes(paymentMode)) {
      if (initialPaymentMode && allowedPaymentModes.includes(initialPaymentMode)) {
        setPaymentMode(initialPaymentMode);
      } else {
        setPaymentMode(allowedPaymentModes[0]);
      }
    }
  }, [allowedPaymentModes]);

  if (!boardingPoints || !departureBus || !searchData) {
    return <div className="text-center py-8 text-gray-600">Loading form data...</div>;
  }

  useEffect(() => {
    if (!voucherToken || !isWaitingForApproval) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/voucher-status?token=${encodeURIComponent(voucherToken)}`);
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        setVoucherStatus(body.status || null);
        if (body.status === "approved") {
          setIsWaitingForApproval(false);
          setIsProcessing(false);
          const orderId = body.orderId || body.bookingRef || '';
          window.location.href = `/ticket/${orderId}`;
        } else if (body.status === "expired") {
          setIsWaitingForApproval(false);
          setIsProcessing(false);
          makeToast({
            title: "Voucher expired",
            description: "Voucher request expired. You can retry or contact admin.",
            action: (
              <button
                onClick={() => {
                  setShowVoucherExpiredDialog(true);
                }}
                className="underline text-[rgb(0,153,153)]"
              >
                Retry
              </button>
            ),
          });
        }
      } catch (err) {
        // ignore intermittent errors
      }
    };

    check();
    const id = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [voucherToken, isWaitingForApproval]);

  // FIXED: Show ALL passengers, not just non-neighbour-free
  const displayPassengers = passengers;

  return (
    <div className="max-w-7xl mx-auto my-4 sm:my-8 px-3 sm:px-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 sm:p-6 border-b" style={{ backgroundColor: "rgb(0, 153, 153)" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Passenger Details & Contacts
          </h2>
          <p className="text-sm text-white/90 mt-1">
            Please provide details for all passengers and your contact information
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Fare Summary - Same as before */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
                1
              </span>
              Fare Summary
            </h3>
            <div className="space-y-3">
              {departureBus && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                      Departure: {departureBus.routeOrigin} → {departureBus.routeDestination}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {departureBus.departureDate
                        ? format(new Date(departureBus.departureDate), "dd MMM yyyy")
                        : "N/A"}{" "}
                      • {departureSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">
                    P {departureTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {returnBus && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                      Return: {returnBus.routeOrigin} → {returnBus.routeDestination}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {returnBus.departureDate
                        ? format(new Date(returnBus.departureDate), "dd MMM yyyy")
                        : "N/A"}{" "}
                      • {returnSeats?.length || 0} seat(s)
                      {returnNeighbourFree && (
                        <span className="ml-2 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          Neighbour-Free
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">
                    P {returnTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {passengers.filter((p) => p.type === "child").length > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">
                    Child Fare ({passengers.filter((p) => p.type === "child").length}):
                  </p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">
                    P {passengers.filter((p) => p.type === "child").length * childFare}
                  </p>
                </div>
              )}

              {infantCount > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">Infant Fare ({infantCount}):</p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">
                    P {infantTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {Object.entries(selectedAddons).map(([key, value]) => {
                const addon = ADDONS.find((a) => a.key === key);
                if (addon && (value.departure || value.return)) {
                  const departurePayingCount = passengers.filter((p) => !p.isReturn && !p.isNeighbourFreeSeat).length;
                  const returnPayingCount = passengers.filter((p) => p.isReturn && !p.isNeighbourFreeSeat).length;
                  const isAgentBooking = !!agent;
                  const departureDateObj = departureBus?.departureDate ? new Date(departureBus.departureDate) : undefined;
                  const returnDateObj = returnBus?.departureDate ? new Date(returnBus.departureDate) : undefined;
                  const depPrice = getAddonPrice(key, departureBus?.routeOrigin, departureDateObj, isAgentBooking);
                  const returnPrice = getAddonPrice(key, returnBus?.routeOrigin, returnDateObj, isAgentBooking);
                  const addonTotal = (value.departure ? depPrice * departurePayingCount : 0) + (isRoundTrip && value.return ? returnPrice * returnPayingCount : 0);
                  return (
                    <div key={key} className="flex justify-between pt-2">
                      <p className="font-medium text-gray-700 text-sm sm:text-base">{addon.label}:</p>
                      <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">
                        P {addonTotal.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              })}

              {agent && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">Agent Discount (10%):</p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">
                    -P {agentDiscount.toFixed(2)}
                  </p>
                </div>
              )}

              {consultant && consultantDiscount > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">
                    Consultant Discount ({
                      consultantDiscountType === "student"
                        ? "5% Student"
                        : consultantDiscountType === "senior"
                          ? "15% Senior"
                          : consultantDiscountType === "family"
                            ? "Family Bundle"
                            : consultantDiscountType === "group"
                              ? "Group Discount"
                              : ""
                    }):
                  </p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">
                    -P {consultantDiscount.toFixed(2)}
                  </p>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t-2 border-gray-200 mt-2">
                <p className="font-bold text-base sm:text-lg text-gray-800">Grand Total:</p>
                <p className="font-bold text-[rgb(0,153,153)] text-lg sm:text-xl">P {useFreeVoucher ? '0.00' : finalTotal.toFixed(2)}</p>
              </div>
              
              {consultant && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
                  <button
                    type="button"
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                    tabIndex={-1}
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" /></svg>
                      </span>
                      <h3 className="font-bold text-lg text-gray-800">Consultant Discount</h3>
                    </div>
                  </button>
                  <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Discount</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${consultantDiscountType === "none" ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setConsultantDiscountType("none")}
                      >
                        No Discount
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${useFreeVoucher ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => {
                          if (!useFreeVoucher) {
                            setPaymentMode("Free Voucher");
                            setUseFreeVoucher(true);
                            setConsultantDiscountType("none");
                          } else {
                            setPaymentMode("Credit Card");
                            setUseFreeVoucher(false);
                          }
                        }}
                      >
                        Free Voucher
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${consultantDiscountType === "student" ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setConsultantDiscountType("student")}
                      >
                        5% Student Discount <span className="ml-1 text-xs">(Present student ID)</span>
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${consultantDiscountType === "senior" ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setConsultantDiscountType("senior")}
                      >
                        15% Senior Discount <span className="ml-1 text-xs">(60yrs+)</span>
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${consultantDiscountType === "family" ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setConsultantDiscountType("family")}
                      >
                        Family Bundle <span className="ml-1 text-xs">(20% off 5th person)</span>
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${consultantDiscountType === "group" ? "bg-[rgb(255,199,33)] text-white border-[rgb(255,199,33)]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setConsultantDiscountType("group")}
                      >
                        Group Discount <span className="ml-1 text-xs">(10% for 10+)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Details Section - FIXED: Shows ALL passengers */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection("passengers")}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex flex-col sm:flex-row sm:justify-between sm:items-center transition-colors"
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
                  2
                </span>
                <h3 className="font-bold text-lg text-gray-800">Passenger Details ({passengers.length} total seats)</h3>
                {(departureNeighbourFree || returnNeighbourFree) && (
                  <span
                    className="ml-3 flex items-center gap-1 bg-[#f7f5ef] border rounded px-2 py-1 text-xs font-medium"
                    style={{ borderColor: "rgb(148,138,84)", color: "rgb(148,138,84)" }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" style={{ color: "rgb(148,138,84)" }} />
                    Neighbour-Free: Companion seats auto-filled with same details
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {returnSeats.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyDepartureToReturn();
                    }}
                    className="bg-[rgb(255,199,33)] hover:bg-[rgb(255,219,33)] text-white px-3 py-1 h-auto text-xs sm:text-sm border border-[rgb(255,199,33)] w-full sm:w-auto"
                    tabIndex={-1}
                  >
                    <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Copy to Return
                  </Button>
                )}
                {openSections.passengers ? (
                  <ChevronUp className="text-gray-500 mt-1 sm:mt-0" />
                ) : (
                  <ChevronDown className="text-gray-500 mt-1 sm:mt-0" />
                )}
              </div>
            </button>

            {openSections.passengers && (
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {displayPassengers.length > 0 ? (
                  displayPassengers.map((passenger: Passenger, idx: number) => {
                    const isChild = passenger.type === "child";
                    const isCompanion = passenger.isNeighbourFreeSeat;
                    let companionSeat = null;
                    if (!passenger.isReturn && departureNeighbourFree && !isCompanion) {
                      const primaryIndex = depNF.primary.indexOf(passenger.seatNumber);
                      if (primaryIndex !== -1) {
                        companionSeat = depNF.companion[primaryIndex];
                      }
                    } else if (passenger.isReturn && returnNeighbourFree && !isCompanion) {
                      const primaryIndex = retNF.primary.indexOf(passenger.seatNumber);
                      if (primaryIndex !== -1) {
                        companionSeat = retNF.companion[primaryIndex];
                      }
                    }
                    return (
                      <div key={passenger.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                          <span
                            className={`font-medium text-white px-3 py-1 rounded-full text-sm w-fit ${passenger.isReturn ? "bg-[rgb(148,138,84)]" : "bg-[rgb(255,199,33)]"
                              }`}
                          >
                            {passenger.seatNumber}
                            {companionSeat && ` + ${companionSeat}`}
                            {((departureNeighbourFree && !passenger.isReturn) ||
                              (returnNeighbourFree && passenger.isReturn)) && !isCompanion && (
                                <span className="ml-2 text-white-800 text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgb(255,199,33)" }}>
                                  Neighbour-Free
                                </span>
                              )}
                            {isCompanion && (
                              <span className="ml-2 text-white-800 text-xs px-2 py-1 rounded" style={{ backgroundColor: "#888" }}>
                                Companion Seat
                              </span>
                            )}
                          </span>
                          <Select
                            value={passenger.type || "adult"}
                            onValueChange={(value) => updatePassenger(passenger.id, "type", value)}
                            disabled={isCompanion}
                          >
                            <SelectTrigger className="w-full sm:w-[180px] border-gray-300 focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)]">
                              <SelectValue placeholder="Passenger Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adult">Adult</SelectItem>
                              <SelectItem value="child">Child (2-11 yrs)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <Select
                              value={passenger.title}
                              onValueChange={(value) => updatePassenger(passenger.id, "title", value)}
                              disabled={isCompanion}
                            >
                              <SelectTrigger className="w-full border-gray-300 focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)]">
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Miss">Miss</SelectItem>
                                <SelectItem value="Dr">Dr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                            <Input
                              value={passenger.firstName}
                              onChange={(e) => updatePassenger(passenger.id, "firstName", e.target.value)}
                              placeholder="First name"
                              required={!isCompanion}
                              disabled={isCompanion}
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                            {isCompanion && (
                              <p className="text-xs text-gray-500 mt-1">Auto-filled from primary seat</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                            <Input
                              value={passenger.lastName}
                              onChange={(e) => updatePassenger(passenger.id, "lastName", e.target.value)}
                              placeholder="Last name"
                              required={!isCompanion}
                              disabled={isCompanion}
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {isChild && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                              <Input
                                type="date"
                                value={passenger.birthdate || ""}
                                onChange={(e) => updatePassenger(passenger.id, "birthdate", e.target.value)}
                                placeholder="Birthdate"
                                required={isChild && !isCompanion}
                                disabled={isCompanion}
                                className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                min={getDateYearsAgo(11)}
                                max={getDateYearsAgo(2)}
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                            <Input
                              value={passenger.passportNumber || ""}
                              onChange={(e) => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                              placeholder="Passport Number"
                              required={!isCompanion}
                              disabled={isCompanion}
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Phone</label>
                            <div className="flex gap-2">
                              <CountryCodeSelect
                                value={passenger.phoneCountryCode || "+267"}
                                onChange={(value) => updatePassenger(passenger.id, "phoneCountryCode", value)}
                              />
                              <Input
                                value={passenger.phone || ""}
                                onChange={(e) => updatePassenger(passenger.id, "phone", e.target.value)}
                                placeholder="Phone Number"
                                disabled={isCompanion}
                                className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300 flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next of Kin Name</label>
                            <Input
                              value={passenger.nextOfKinName || ""}
                              onChange={(e) => updatePassenger(passenger.id, "nextOfKinName", e.target.value)}
                              placeholder="Next of Kin Name"
                              disabled={isCompanion}
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next of Kin Phone</label>
                            <div className="flex gap-2">
                              <CountryCodeSelect
                                value={passenger.nextOfKinPhoneCountryCode || "+267"}
                                onChange={(value) => updatePassenger(passenger.id, "nextOfKinPhoneCountryCode", value)}
                              />
                              <Input
                                value={passenger.nextOfKinPhone || ""}
                                onChange={(e) => updatePassenger(passenger.id, "nextOfKinPhone", e.target.value)}
                                placeholder="Next of Kin Phone"
                                disabled={isCompanion}
                                className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300 flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        {!isCompanion && (
                          <>
                            <div className="flex items-center gap-2 mt-4">
                              <Checkbox
                                id={`infant-${passenger.id}`}
                                checked={!!passenger.hasInfant}
                                onCheckedChange={(checked) => updatePassenger(passenger.id, "hasInfant", checked)}
                                className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                              />
                              <label htmlFor={`infant-${passenger.id}`} className="text-sm text-gray-600">
                                Bringing an infant (0-2 yrs, sits on lap)
                                {(departureNeighbourFree && !passenger.isReturn) ||
                                  (returnNeighbourFree && passenger.isReturn) ? (
                                  <span className="ml-2 text-xs font-medium" style={{ color: "rgb(148,138,84)" }}>
                                    No Charge for infant in Neighbour-Free
                                  </span>
                                ) : null}
                              </label>
                            </div>
                            {passenger.hasInfant && (
                              <div className="mt-4 p-3 sm:p-4 rounded bg-gray-50 border border-gray-200">
                                <h4 className="font-medium text-[rgb(0,153,153)] mb-3">Infant Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Infant's Name</label>
                                    <Input
                                      value={passenger.infantName || ""}
                                      onChange={(e) => updatePassenger(passenger.id, "infantName", e.target.value)}
                                      placeholder="Infant's Name"
                                      required
                                      className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Infant's Birthdate</label>
                                    <Input
                                      type="date"
                                      value={passenger.infantBirthdate || ""}
                                      onChange={(e) => updatePassenger(passenger.id, "infantBirthdate", e.target.value)}
                                      placeholder="Infant's Birthdate"
                                      required
                                      className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                      max={new Date().toISOString().split("T")[0]}
                                    />
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                                  <Input
                                    value={passenger.infantPassportNumber || ""}
                                    onChange={(e) => updatePassenger(passenger.id, "infantPassportNumber", e.target.value)}
                                    placeholder="Passport Number"
                                    required
                                    className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">No passengers to display</div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details Section - Same as before */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection("contact")}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                <h3 className="font-bold text-lg text-gray-800">Purchaser Details</h3>
              </div>
              {openSections.contact ? (
                <ChevronUp className="text-gray-500" />
              ) : (
                <ChevronDown className="text-gray-500" />
              )}
            </button>
            {openSections.contact && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <Input
                      value={contactDetails.name}
                      onChange={(e) => handleContactChange("name", e.target.value)}
                      placeholder="Your Name"
                      className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Ticket will be sent to this email)</label>
                    <Input
                      type="email"
                      value={contactDetails.email}
                      onChange={(e) => handleContactChange("email", e.target.value)}
                      placeholder="Email"
                      className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <div className="flex gap-2">
                      <CountryCodeSelect
                        value={contactDetails.mobileCountryCode || "+267"}
                        onChange={(value) => handleContactChange("mobileCountryCode", value)}
                      />
                      <Input
                        type="tel"
                        value={contactDetails.mobile}
                        onChange={(e) => handleContactChange("mobile", e.target.value)}
                        placeholder="Mobile"
                        className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300 flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                    <Select
                      value={contactDetails.idType}
                      onValueChange={(value) => handleContactChange("idType", value)}
                      required
                    >
                      <SelectTrigger className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300">
                        <SelectValue placeholder="ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    <Input
                      value={contactDetails.idNumber}
                      onChange={(e) => handleContactChange("idNumber", e.target.value)}
                      placeholder="Passport Number"
                      className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact Section - Same as before */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection("emergency")}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                <h3 className="font-bold text-lg text-gray-800">Emergency Contact</h3>
              </div>
              {openSections.emergency ? (
                <ChevronUp className="text-gray-500" />
              ) : (
                <ChevronDown className="text-gray-500" />
              )}
            </button>
            {openSections.emergency && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={emergencyContact.name}
                    onChange={(e) => handleEmergencyChange("name", e.target.value)}
                    placeholder="Name"
                    className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={emergencyContact.phoneCountryCode || "+267"}
                      onChange={(value) => handleEmergencyChange("phoneCountryCode", value)}
                    />
                    <Input
                      type="tel"
                      value={emergencyContact.phone}
                      onChange={(e) => handleEmergencyChange("phone", e.target.value)}
                      placeholder="Phone Number"
                      className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300 flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trip Points Section - Same as before */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection("points")}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  5
                </span>
                <h3 className="font-bold text-lg text-gray-800">Trip Points</h3>
              </div>
              {openSections.points ? (
                <ChevronUp className="text-gray-500" />
              ) : (
                <ChevronDown className="text-gray-500" />
              )}
            </button>
            {openSections.points && (
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="font-bold text-[rgb(148,138,84)] mb-3 text-base sm:text-lg">Departure Trip Points</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Point</label>
                      <select
                        value={departureBoardingPoint}
                        onChange={(e) => setDepartureBoardingPoint(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
                      >
                        <option value="">Select boarding point</option>
                        {departureOriginPoints.map((point) => (
                          <option key={point.id} value={point.name}>
                            {formatPoint(point.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dropping Point</label>
                      <select
                        value={departureDroppingPoint}
                        onChange={(e) => setDepartureDroppingPoint(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
                      >
                        <option value="">Select dropping point</option>
                        {departureDestinationPoints.map((point) => (
                          <option key={point.id} value={point.name}>
                            {formatPoint(point.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {isRoundTrip && (
                  <div>
                    <h4 className="font-bold text-[rgb(148,138,84)] mb-3 text-base sm:text-lg">Return Trip Points</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Point</label>
                        <select
                          value={returnBoardingPoint}
                          onChange={(e) => setReturnBoardingPoint(e.target.value)}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
                        >
                          <option value="">Select boarding point</option>
                          {returnOriginPoints.map((point) => (
                            <option key={point.id} value={point.name}>
                              {formatPoint(point.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dropping Point</label>
                        <select
                          value={returnDroppingPoint}
                          onChange={(e) => setReturnDroppingPoint(e.target.value)}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
                        >
                          <option value="">Select dropping point</option>
                          {returnDestinationPoints.map((point) => (
                            <option key={point.id} value={point.name}>
                              {formatPoint(point.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add-ons Section - Same as before */}
          <div className="border-2 border-[rgb(255,199,33)] rounded-xl overflow-hidden mt-6 bg-gray-50">
            <button
              onClick={() => openOnlySection("addons")}
              className="w-full p-4 bg-gray-100 text-left flex justify-between items-center hover:bg-gray-200 transition-all"
            >
              <h3 className="font-bold text-lg text-[rgb(148,138,84)] flex items-center gap-2">
                Personalize Your Trip
              </h3>
              {openSections.addons ? (
                <ChevronUp className="text-[rgb(148,138,84)]" />
              ) : (
                <ChevronDown className="text-[rgb(148,138,84)]" />
              )}
            </button>
            {openSections.addons && (
              <div className="p-4 space-y-4">
                <div className="text-sm text-[rgb(0,153,153)] mb-4 font-medium bg-gray-100 p-3 rounded-lg border border-gray-200">
                  Select extras for each passenger. Prices are per passenger, per trip.
                </div>

                {ADDONS.map((addon: any) => {
                  const depOrigin = (departureBus?.routeOrigin || searchData.from || "")
                    .toLowerCase()
                    .trim();
                  const isWimpy = addon.key.startsWith("wimpyMeal");
                  const isInsurance = addon.key === "travelInsurance";
                  let wimpyDisabled = false;
                  let wimpyInfo = null;
                  let insuranceInfo = null;
                  const isAgentBooking = !!agent;
                  const departureDateObj = departureBus?.departureDate ? new Date(departureBus.departureDate) : undefined;
                  let price = getAddonPrice(addon.key, depOrigin, departureDateObj, isAgentBooking);

                  if (isWimpy) {
                    if (depOrigin !== "gaborone") return null;
                    
                    const departurePayingPassengers = passengers.filter((p) => !p.isReturn && !p.isNeighbourFreeSeat);
                    if (addon.key === "wimpyMeal2" && departurePayingPassengers.length <= 1) return null;

                    const depDate = departureBus?.departureDate
                      ? new Date(departureBus.departureDate)
                      : null;

                    // Day check: Wimpy breakfast is ONLY available on Sat, Sun, Mon
                    if (depDate) {
                      const dayOfWeek = depDate.getDay();
                      const isAllowedDay = [6, 0, 1].includes(dayOfWeek); // 6=Sat, 0=Sun, 1=Mon
                      if (!isAllowedDay) return null;
                    }
                    
                    // Note only for Meal 2 as requested
                    if (addon.key === "wimpyMeal2") {
                      wimpyInfo = (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs sm:text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-yellow-800">Wimpy Ordering Information</p>
                              <p className="mt-1 italic">
                                Note: You can opt for a Wimpy Cheese Burger or a Double Up Breakfast.
                              </p>
                              <p className="mt-1 text-gray-500 text-[10px] sm:text-xs">
                                * Available from Gaborone only.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }

                  if (isInsurance) {
                    insuranceInfo = (
                      <div className="mt-2 p-3 bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700">
                        <p className="font-medium text-[rgb(0,153,153)] mb-2">Travel Insurance Information</p>
                        <p>
                          This is standard cover valid for 1-7 days of travel excluding America. Including
                          America will be additional P105 for up to 7 days travel. Contact our office for
                          long stay &/ comprehensive cover. Share passport copy if clicking this option
                          to{" "}
                          <span className="font-semibold">tickets@reecatravel.co.bw</span> with
                          your ticket ID.
                        </p>
                      </div>
                    );
                  }

                  const addonImages = addon.images || (addon.image ? [addon.image] : []);

                  return (
                    <div
                      key={addon.key}
                      className="flex flex-col border border-gray-200 rounded-xl p-3 sm:p-4 bg-white hover:bg-gray-50 transition-all mb-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 w-full">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {addonImages.length > 0 && (
                            <div className="flex gap-2 shrink-0">
                              {addonImages.map((img: string, i: number) => (
                                <div 
                                  key={i}
                                  className="relative w-24 h-24 shrink-0 overflow-hidden rounded-lg border-2 border-transparent hover:border-[rgb(0,153,153)] cursor-pointer transition-all shadow-sm"
                                  onClick={() => setSelectedImage(img)}
                                >
                                  <img 
                                    src={img} 
                                    alt={`${addon.label} ${i + 1}`} 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors flex items-center justify-center group">
                                    <ShoppingBag className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-full border border-gray-200">
                                  {addon.icon}
                                </div>
                                <div>
                                  <div className="font-bold text-[rgb(0,153,153)] text-sm sm:text-base flex items-center gap-1">
                                    {addon.label}
                                    {isInsurance && (
                                      <button
                                        type="button"
                                        aria-label="More info"
                                        onClick={() => setShowInsuranceInfo(!showInsuranceInfo)}
                                        className="ml-1 p-1 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
                                      >
                                        <Info className="h-4 w-4 text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-xs text-[rgb(148,138,84)]">
                                    {addon.description}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 self-end sm:self-center">
                                <div className="flex gap-4">
                                  <label 
                                    className="flex items-center gap-2 text-sm cursor-pointer group"
                                  >
                                    <Checkbox
                                      checked={!!selectedAddons[addon.key]?.departure}
                                      onCheckedChange={(checked) =>
                                        handleAddonChange(addon.key, "departure", !!checked)
                                      }
                                      className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                                      disabled={isWimpy && wimpyDisabled}
                                    />
                                    <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-[rgb(0,153,153)]">Departure</span>
                                  </label>
                                  {isRoundTrip && addon.showOnReturn && (
                                    <label 
                                      className="flex items-center gap-2 text-sm cursor-pointer group"
                                    >
                                      <Checkbox
                                        checked={!!selectedAddons[addon.key]?.return}
                                        onCheckedChange={(checked) =>
                                          handleAddonChange(addon.key, "return", !!checked)
                                        }
                                        className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                                        disabled={isWimpy && wimpyDisabled}
                                      />
                                      <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-[rgb(0,153,153)]">Return</span>
                                    </label>
                                  )}
                                </div>
                                <span className="font-bold text-[rgb(255,199,33)] text-sm sm:text-base bg-gray-100 px-3 py-1 rounded-full border border-gray-200 min-w-[70px] text-center shadow-inner">
                                  {price > 0 ? `P ${price}` : "FREE"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Preference Select for Wimpy Meal 2 only */}
                            {addon.key === "wimpyMeal2" && (selectedAddons[addon.key]?.departure || selectedAddons[addon.key]?.return) && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedAddons[addon.key]?.departure && (
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Departure Preference</label>
                                    <Select 
                                      value={selectedAddons[addon.key]?.departurePref}
                                      onValueChange={(val) => handleAddonPreference(addon.key, "departure", val)}
                                    >
                                      <SelectTrigger className="h-9 text-xs border-gray-200">
                                        <SelectValue placeholder="Choose meal option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Cheese Burger">Wimpy Cheese Burger</SelectItem>
                                        <SelectItem value="Double Up">Double Up Breakfast</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                {isRoundTrip && selectedAddons[addon.key]?.return && (
                                   <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Return Preference</label>
                                    <Select 
                                      value={selectedAddons[addon.key]?.returnPref}
                                      onValueChange={(val) => handleAddonPreference(addon.key, "return", val)}
                                    >
                                      <SelectTrigger className="h-9 text-xs border-gray-200">
                                        <SelectValue placeholder="Choose meal option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Cheese Burger">Wimpy Cheese Burger</SelectItem>
                                        <SelectItem value="Double Up">Double Up Breakfast</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            )}

                            {isWimpy && wimpyInfo}
                            {isInsurance && showInsuranceInfo && insuranceInfo}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {promotions.map((promo: any) => (
                  <div
                    key={promo.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-yellow-50 rounded-full border border-yellow-200">
                        <Gift className="h-5 w-5 text-[rgb(255,199,33)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">
                          {promo.title}
                        </div>
                        <div className="text-xs sm:text-sm text-[rgb(148,138,84)] mt-1">
                          {promo.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 ml-auto">
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-sm">
                          <Checkbox
                            checked={!!selectedAddons[promo.id]?.departure}
                            onCheckedChange={(checked) =>
                              handleAddonChange(promo.id, "departure", !!checked)
                            }
                            className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                          />
                          <span className="text-xs sm:text-sm">Departure</span>
                        </label>
                        {isRoundTrip && (
                          <label className="flex items-center gap-1 text-sm">
                            <Checkbox
                              checked={!!selectedAddons[promo.id]?.return}
                              onCheckedChange={(checked) =>
                                handleAddonChange(promo.id, "return", !!checked)
                              }
                              className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                            />
                            <span className="text-xs sm:text-sm">Return</span>
                          </label>
                        )}
                      </div>
                      <span className="font-bold text-[rgb(255,199,33)] text-sm sm:text-base bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                        FREE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Mode Section - Same as before */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-base sm:text-lg">
              <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
                6
              </span>
              Payment Mode
            </h3>
            <div>
              <Select value={paymentMode} onValueChange={(v) => { setPaymentMode(v); setUseFreeVoucher(false); }} required>
                <SelectTrigger className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const canonical = [
                      { value: 'Credit Card', label: 'Credit Card | Debit Card' },
                      { value: 'Bank Deposit', label: 'Pay with Bank Deposit' },
                      { value: 'Swipe in Person', label: 'Swipe at Office / Bus' },
                      { value: 'Cash', label: 'Paid Cash (In Person)', conditional: !!consultant },
                      { value: 'Free Voucher', label: 'Free Voucher (Request Auth)', conditional: !!consultant },
                      { value: 'Reservation Paid', label: 'Already Paid (Reservation)' },
                    ] as { value: string; label: string; conditional?: boolean }[];

                    const filtered = canonical.filter((opt) => {
                      if (opt.value === 'Free Voucher' && !consultant) return false;
                      if (allowedPaymentModes && allowedPaymentModes.length > 0) {
                        return allowedPaymentModes.includes(opt.value);
                      }
                      if (opt.value === 'Reservation Paid') return false;
                      return true;
                    });

                    return filtered.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked: boolean | string) => {
                setAgreedToTerms(!!checked);
                if (checked) setShowPolicyModal(true);
              }}
              className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)] mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
            >
              By continuing you agree to our{" "}
              <span
                className="underline text-[rgb(0,153,153)] cursor-pointer hover:text-[rgb(0,123,123)] font-semibold"
                onClick={() => setShowPolicyModal(true)}
              >
                TERMS & CONDITIONS
              </span>{" "}
              and Cancellation Policies
            </label>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-12 sm:h-14 bg-[#FFD700] hover:bg-[rgb(0,123,123)] text-white font-semibold rounded-xl text-base sm:text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isProcessing || !agreedToTerms || !policyAccepted || !contactDetails.name || !contactDetails.email || !contactDetails.mobile}
            onClick={async () => {
              if (!policyAccepted) {
                setShowPolicyModal(true);
                return;
              }

              setIsProcessing(true);
              if (paymentMode === "Bank Deposit" || paymentMode === "Swipe in Person") {
                try {
                  setShowBankDepositLoading(true);
                  const bookingPayload = createBookingPayload();
                  const res = await fetch("/api/booking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bookingPayload),
                  });
                  if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody?.error || "Failed to create booking");
                  }
                  const data = await res.json();
                  setTimeout(() => {
                    setShowBankDepositLoading(false);
                    setIsProcessing(false);
                    const orderId = data.bookingRef || bookingPayload.orderId;
                    window.location.href = `/ticket/${orderId}`;
                  }, 800);
                } catch (err: any) {
                  setShowBankDepositLoading(false);
                  setIsProcessing(false);
                  alert(err?.message || "Error creating booking. Please try again.");
                }
              } else if (paymentMode === "Reservation Paid") {
                try {
                  setIsProcessing(true);
                  const bookingPayload = createBookingPayload();
                  const res = await fetch('/api/create-dpo-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...bookingPayload, skipDPO: true }),
                  });
                  if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody?.error || 'Failed to create booking');
                  }
                  const data = await res.json();
                  const orderId = data.orderId || bookingPayload.orderId;
                  window.location.href = `/ticket/${orderId}`;
                } catch (err: any) {
                  setIsProcessing(false);
                  alert(err?.message || 'Error creating booking. Please try again.');
                }
              } else if (paymentMode === "Free Voucher") {
                try {
                  const bookingPayload = createBookingPayload();
                  const res = await fetch("/api/request-voucher-auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bookingPayload),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.error || "Failed to request voucher authorization");
                  }
                  const body = await res.json();
                  setVoucherToken(body.token);
                  setVoucherStatus("pending");
                  setIsWaitingForApproval(true);
                } catch (err: any) {
                  makeToast({ title: "Request failed", description: err?.message || "Failed to request voucher authorization" });
                  setIsProcessing(false);
                }
              } else {
                try {
                  await onProceedToPayment();
                } finally {
                  setIsProcessing(false);
                }
              }
            }}
          >
            {useFreeVoucher
              ? isWaitingForApproval
                ? "Waiting for approval..."
                : "Request Auth"
              : paymentMode === "Bank Deposit"
                ? "Proceed"
                : paymentMode === "Cash"
                  ? "Mark as Paid"
                  : paymentMode === "Reservation Paid"
                    ? "Submit"
                    : `Pay (P ${finalTotal.toFixed(2)})`}
          </Button>

          {showBankDepositLoading && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-[90vw] text-center animate-fade-in">
                <div className="flex flex-col items-center justify-center gap-3">
                  <svg
                    className="animate-spin h-8 w-8 text-teal-600 mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <h2 className="text-lg font-bold text-teal-700">Processing Booking...</h2>
                  <p className="text-gray-700 text-sm mt-1">
                    Please wait while we create your booking.
                    <br />
                    {paymentMode === "Bank Deposit" ? (
                      <>
                        <span className="font-semibold text-[rgb(0,153,153)]">IMPORTANT:</span> Share
                        proof of deposit to{" "}
                        <span className="font-semibold">tickets@reecatravel.co.bw</span> at least{" "}
                        <span className="font-semibold">1 hours after booking</span> or your booking
                        will be <span className="font-semibold text-red-600">nullified</span>.
                      </>
                    ) : (
                      <>
                        You have chosen to <span className="font-semibold text-[rgb(0,153,153)]">Swipe at Office</span>. 
                        Please ensure you arrive at the designated point to complete payment.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>
          {departureBus && (
            <PaymentGateway
              bookingData={createBookingPayload()}
              onPaymentComplete={onPaymentComplete}
              setShowPayment={setShowPayment}
              onReservationConflict={(msg) => {
                setReservationMessage(msg || 'One or more seats are no longer available');
                setShowReservationConflict(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl bg-black/90 border-none p-0 flex items-center justify-center overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img 
                src={selectedImage} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg" 
                alt="Meal Preview" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Close preview"
              >
                <ChevronDown className="h-6 w-6 rotate-180" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Reservation Conflict Modal */}
      {showReservationConflict && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800">Seat conflict detected</h3>
            <p className="text-sm text-gray-600 mt-2">{reservationMessage}</p>
            {currentUnavailable.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700">Currently unavailable seats:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentUnavailable.map((s) => (
                    <span key={s} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={async () => {
                  // Refresh availability and keep payment open
                }}
              >
                Refresh availability
              </button>
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                onClick={() => {
                  setShowReservationConflict(false);
                  setShowPayment(false);
                }}
              >
                Reselect seats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Expired Retry Dialog */}
      <Dialog open={showVoucherExpiredDialog} onOpenChange={setShowVoucherExpiredDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Voucher expired</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">Your voucher request has expired. Would you like to retry requesting authorization?</p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowVoucherExpiredDialog(false)}>Cancel</Button>
              <Button onClick={() => requestVoucherAuth()} disabled={isProcessing}>{isProcessing ? 'Retrying...' : 'Retry'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        mode="user"
        onAgree={() => {
          setPolicyAccepted(true);
          setShowPolicyModal(false);
        }}
      />

      {/* Bank Deposit Notice */}
      {showBankDepositNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-teal-700">Bank Deposit Instructions</h2>
            <p className="mb-4 text-gray-700">
              With this option you are required to provide proof of deposit within 1
              hour of your booking reservations to{" "}
              <span className="font-semibold">tickets@reecatravel.co.bw</span> or visit our
              office.
            </p>
            <button
              className="mt-2 px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              onClick={() => setShowBankDepositNotice(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <WhatsAppButton />
    </div>
  );
}

function getDateYearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}