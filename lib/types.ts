export interface BusCategory {
  id: string;
  registration: string;
  name: string;
  image: string;
  price: number;
  features: string[];
  amenities: { icon: any; name: string }[];
  rating: number;
  description: string;
  seats: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  isRequest?: boolean;
  route?: string;
}

export interface BoardingPoint {
  id: string;
  name: string;
  times: string[];
}

export interface SearchData {
  from: string;
  to: string;
  departureDate: Date;
  returnDate: Date | null;
  seats: number;
  isReturn: boolean;
}

export interface Seat {
  id: string;
  number: string;
  isAvailable: boolean;
  isSelected: boolean;
  row: number;
  position: string;
  side: string;
  seatIndex: number;
}

export interface Passenger {
  id: string;
  name: string;
  title: string;
  seatNumber: string;
}

export interface PaymentData {
  tripId: string;
  totalPrice: number;
  selectedSeats: string[];
  departureSeats: string[]; // <-- add this
  returnSeats?: string[];   // <-- add this
  userName: string;
  userEmail: string;
  boardingPoint: string;
  droppingPoint: string;
  orderId: string;
  promoCode?: string;
  discountAmount?: number;
  userPhone?: string;
  returnTripId?: string;
  returnPrice?: number;
}

export interface DpoTransactionResponse {
  success: boolean;
  orderRef?: string;
  paymentUrl?: string;
  transactionToken?: string;
  error?: string;
}

export interface DpoVerifyResponse {
  success: boolean;
  result?: string;
  explanation?: string;
  transactionAmount?: number;
  transactionCurrency?: string;
  isPaid?: boolean;
  error?: string;
}

export interface CreateTokenRequest extends PaymentData {
  redirectUrl: string;
  backUrl: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
}

export interface BookingData extends PaymentData {
  passengers: Passenger[];
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  returnTripId?: string;
  passengers: Passenger[];
  userName: string;
  userEmail: string;
  userPhone?: string;
  seats: string;
  seatCount: number;
  totalPrice: number;
  boardingPoint: string;
  droppingPoint: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  orderId: string;
  transactionToken?: string;
  paymentStatus: string;
  bookingStatus: string;
  promoCode?: string;
  discountAmount: number;
  competitorInfo?: any;
  scanned: boolean;
  lastScanned?: Date;
  scannerId?: string;
  createdAt: Date;
  updatedAt: Date;
}