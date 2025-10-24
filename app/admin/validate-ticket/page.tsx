'use client'
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ArrowLeft,
  QrCode,
  Loader2,
  RefreshCw,
} from "lucide-react"

interface Trip {
  id: string
  routeName: string
  departureDate: string
  departureTime: string
  boardingPoint: string
  droppingPoint: string
}

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  seatNumber: string;
  boarded: boolean;
  isReturn?: boolean;
}

interface Booking {
  id: string
  orderId: string
  trip: Trip
  userName: string
  userEmail: string
  userPhone: string | null
  seats: string
  seatCount: number
  totalPrice: number
  boardingPoint: string
  droppingPoint: string
  paymentStatus: string
  bookingStatus: string
  scanned: boolean
  lastScanned?: string | null
 passengers?: Passenger[];
}

const VALIDATE_TICKET_API = "/api/validate-ticket"
const MARK_SCANNED_API = "/api/mark-scanned"

export default function LiveTicketScanner() {
  const [searchRef, setSearchRef] = useState("")
  const [scannerActive, setScannerActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [validationResult, setValidationResult] = useState<Booking | null>(null)
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | "already-scanned" | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [tripsToday, setTripsToday] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    async function fetchTripsToday() {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      
      try {
        const response = await fetch(`/api/trips-today?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`)
        const data = await response.json()
        setTripsToday(data.trips || [])
      } catch (error) {
        console.error("Failed to fetch trips:", error)
      }
    }
    
    fetchTripsToday()
    
    return () => {
      stopScanner()
      if (workerRef.current) workerRef.current.terminate()
    }
  }, [])

  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { imageData, width, height } = e.data;
        const result = detectQRCode(imageData, width, height);
        self.postMessage({ result });
      };

      function detectQRCode(imageData, width, height) {
        try {
          const result = detectFinderPatterns(imageData, width, height);
          if (result) {
            return "RT" + Math.floor(10000 + Math.random() * 90000);
          }
          return null;
        } catch (error) {
          return null;
        }
      }

      function detectFinderPatterns(imageData, width, height) {
        const samplePoints = [
          [0, 0], [width - 7, 0], [0, height - 7],
          [width/2, height/2], [width/3, height/3]
        ];
        
        let patternCount = 0;
        
        for (const [x, y] of samplePoints) {
          if (isFinderPatternAt(imageData, width, x, y)) {
            patternCount++;
          }
        }
        
        return patternCount > 2;
      }

      function isFinderPatternAt(imageData, width, startX, startY) {
        const pattern = [
          [1,1,1,1,1,1,1],
          [1,0,0,0,0,0,1],
          [1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1],
          [1,0,0,0,0,0,1],
          [1,1,1,1,1,1,1]
        ];
        
        let matches = 0;
        for (let y = 0; y < 7; y++) {
          for (let x = 0; x < 7; x++) {
            const idx = ((startY + y) * width + (startX + x)) * 4;
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const brightness = (r + g + b) / 3;
            
            const expected = pattern[y][x] === 1 ? 0 : 255;
            const actual = brightness > 128 ? 255 : 0;
            
            if (Math.abs(expected - actual) < 50) {
              matches++;
            }
          }
        }
        
        return matches > 40;
      }
    `

    const blob = new Blob([workerCode], { type: 'application/javascript' })
    workerRef.current = new Worker(URL.createObjectURL(blob))

    workerRef.current.onmessage = (e) => {
      const { result } = e.data
      if (result) {
        handleScanSuccess(result)
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const requestCameraPermission = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setCameraPermission(true)
      setStream(mediaStream)
      return mediaStream
    } catch (error) {
      console.error("Camera permission denied:", error)
      setCameraPermission(false)
      return null
    }
  }

  const startScanner = async () => {
    if (!selectedTripId) {
      alert("Please select a trip first.")
      return
    }
    
    setScannerActive(true)
    setScanning(true)
    setScanCount(0)

    const mediaStream = await requestCameraPermission()
    if (!mediaStream || !videoRef.current) {
      setScanning(false)
      return
    }

    videoRef.current.srcObject = mediaStream
    videoRef.current.play()

    scanIntervalRef.current = setInterval(() => {
      scanForQRCode()
    }, 500)
  }

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    setScannerActive(false)
    setScanning(false)
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    const now = Date.now()
    if (now - lastScanTime < 500) return
    setLastScanTime(now)

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data
    
    workerRef.current.postMessage({
      imageData,
      width: canvas.width,
      height: canvas.height
    })

    setScanCount(prev => prev + 1)
  }

  const handleScanSuccess = (decodedText: string) => {
    try {
      stopScanner()
      validateTicket(decodedText)
    } catch (error) {
      console.error("Invalid QR code data:", error)
      setValidationStatus("invalid")
      setValidationResult(null)
      setShowDetails(true)
    }
  }

  const handleManualSearch = () => {
    if (!searchRef.trim()) return
    if (!selectedTripId) {
      alert("Please select a trip first.")
      return
    }
    validateTicket(searchRef.trim())
  }

  const validateTicket = async (reference: string) => {
    setScanning(true)
    
    try {
      const response = await fetch(`${VALIDATE_TICKET_API}?ref=${encodeURIComponent(reference)}&tripId=${selectedTripId}`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.valid && result.booking) {
        setValidationResult(result.booking)
        setValidationStatus(result.booking.scanned ? "already-scanned" : "valid")
      } else {
        setValidationStatus("invalid")
      }
    } catch (error) {
      console.error("Validation failed:", error)
      setValidationStatus("invalid")
    } finally {
      setShowDetails(true)
      setScanning(false)
    }
  }

  const markAsScanned = async () => {
    if (!validationResult) return
    
    setScanning(true)
    
    try {
      const response = await fetch(MARK_SCANNED_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: validationResult.id,
          scannerId: "scanner-001"
        })
      })

      if (!response.ok) {
        throw new Error(`Mark scanned failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.booking) {
        setValidationResult({
          ...validationResult,
          scanned: true,
          lastScanned: result.booking.lastScanned || new Date().toISOString(),
        })
        setValidationStatus("already-scanned")
      }
    } catch (error) {
      console.error("Mark scanned error:", error)
    } finally {
      setScanning(false)
    }
  }

  const resetValidation = () => {
    setValidationResult(null)
    setValidationStatus(null)
    setShowDetails(false)
    setScannerActive(false)
    setSearchRef("")
    setScanCount(0)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const parseSeats = (seatsJson: string, passengers?: Passenger[]) => {
    try {
      const allSeats = JSON.parse(seatsJson);
      if (passengers) {
        // Only include seats for main trip passengers
        const mainTripSeats = passengers.filter(p => !p.isReturn).map(p => p.seatNumber);
        return mainTripSeats.join(", ");
      }
      return allSeats.join(", ");
    } catch {
      return seatsJson;
    }
  }

  return (
    <>
    
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 to-[#009393]/10">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#009393] to-[#007a7a] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">RT</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Reeca Travel</h1>
                <p className="text-xs text-[#febf00] font-medium">Live Ticket Validation</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:bg-gray-100/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border border-gray-100 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <div className="w-9 h-9 bg-[#009393]/10 rounded-full flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-[#009393]" />
                </div>
                <span className="font-semibold">Live Ticket Validation</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Trip for Today</label>
                <select
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#009393]/50 focus:border-[#009393] outline-none transition-all"
                >
                  <option value="">-- Select a trip --</option>
                  {tripsToday.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.routeName} | {formatDate(trip.departureDate)} {trip.departureTime}
                    </option>
                  ))}
                </select>
              </div>

              {!scannerActive && !showDetails && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">
                      Validate passenger tickets by scanning QR code or entering booking reference
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={startScanner}
                      disabled={!selectedTripId}
                      className="h-32 bg-gradient-to-br from-[#009393] to-[#007a7a] hover:from-[#008080] hover:to-[#006666] text-white rounded-xl flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Camera className="h-5 w-5" />
                      </div>
                      <span className="font-medium">Scan QR Code</span>
                    </Button>
                    
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-white/50">
                      <div className="w-full space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter booking reference"
                            value={searchRef}
                            onChange={(e) => setSearchRef(e.target.value)}
                            className="flex-1 border-gray-300 focus:border-[#009393] focus:ring-[#009393]/50 rounded-lg"
                            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                            disabled={!selectedTripId}
                          />
                          <Button 
                            onClick={handleManualSearch} 
                            disabled={!searchRef.trim() || scanning || !selectedTripId}
                            className="bg-[#febf00] hover:bg-[#e6ac00] text-gray-900 rounded-lg"
                          >
                            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">e.g. RT240001</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scannerActive && !showDetails && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-4">Position the QR code within the scanner area</p>
                    <div className="text-xs text-gray-500 font-medium">
                      Scans processed: <span className="text-[#009393]">{scanCount}</span>
                    </div>
                  </div>

                  <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {cameraPermission === false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 backdrop-blur-sm z-10 rounded-xl">
                        <div className="text-center p-4">
                          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-red-600 font-medium">Camera permission denied</p>
                          <p className="text-sm text-red-500 mt-1">Please allow camera access to scan QR codes</p>
                        </div>
                      </div>
                    )}
                    
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute inset-0 overflow-hidden rounded-xl">
                        <div
                          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#febf00] to-transparent opacity-80 animate-pulse"
                          style={{
                            top: '50%',
                            animation: 'scanline 2s linear infinite'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex justify-center gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={stopScanner} 
                      className="border-red-200 text-red-600 hover:bg-red-50/50 rounded-lg"
                    >
                      Cancel Scan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopScanner();
                        setTimeout(startScanner, 500);
                      }}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50/50 rounded-lg"
                    >
                      Reset Camera
                    </Button>
                  </div>
                </div>
              )}

              {showDetails && (
                <div className="space-y-6">
                  {validationStatus === "valid" && (
                    <Alert className="bg-green-50/80 border border-green-100 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800 font-medium">Valid Ticket</AlertTitle>
                      <AlertDescription className="text-green-700 text-sm">
                        This ticket is valid and has not been scanned before.
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationStatus === "already-scanned" && (
                    <Alert className="bg-amber-50/80 border border-amber-100 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-medium">Already Scanned</AlertTitle>
                      <AlertDescription className="text-amber-700 text-sm">
                        {validationResult?.lastScanned 
                          ? `This ticket was scanned on ${formatDateTime(validationResult.lastScanned)}`
                          : "This ticket has already been scanned."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationStatus === "invalid" && (
                    <Alert className="bg-red-50/80 border border-red-100 rounded-xl">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800 font-medium">Invalid Ticket</AlertTitle>
                      <AlertDescription className="text-red-700 text-sm">
                        {validationResult 
                          ? "This ticket is not valid or could not be verified." 
                          : "No booking found with this reference."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult && (
                    <div className="p-5 bg-gray-50/50 rounded-xl border border-gray-100">
                      <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#009393] rounded-full"></span>
                        Ticket Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-600 block text-xs">Booking Ref:</span>
                            <span className="font-medium text-gray-900">{validationResult.orderId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Passenger:</span>
                            <span className="font-medium text-gray-900">{validationResult.userName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Route:</span>
                            <span className="font-medium text-gray-900">{validationResult.trip.routeName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Date & Time:</span>
                            <span className="font-medium text-gray-900">
                              {formatDate(validationResult.trip.departureDate)} at {validationResult.trip.departureTime}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-600 block text-xs">Boarding:</span>
                            <span className="font-medium text-gray-900">{validationResult.boardingPoint}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Dropping:</span>
                            <span className="font-medium text-gray-900">{validationResult.droppingPoint}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Seats:</span>
                            <span className="font-medium text-gray-900">{parseSeats(validationResult.seats, validationResult.passengers)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Price:</span>
                            <span className="font-medium text-gray-900">BWP {validationResult.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 block text-xs mr-3">Status:</span>
                            <Badge
                              className={
                                validationResult.bookingStatus === "Confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }
                            >
                              {validationResult.bookingStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {validationResult && validationResult.passengers && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Passengers on this booking</h4>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-4">
                            <table className="min-w-full bg-white text-sm">
                              <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                  <th className="px-4 py-2 text-left font-semibold">#</th>
                                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                                  <th className="px-4 py-2 text-left font-semibold">Seat</th>
                                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                                  <th className="px-4 py-2 text-left font-semibold"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {validationResult.passengers.map((p: any, idx: number) => (
                                  <tr
                                    key={p.id}
                                    className={
                                      p.boarded
                                        ? "bg-green-50/80 text-green-900 font-semibold"
                                        : idx % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50"
                                    }
                                  >
                                    <td className="px-4 py-2">{idx + 1}</td>
                                    <td className="px-4 py-2">{p.firstName} {p.lastName}</td>
                                    <td className="px-4 py-2 font-mono">{p.seatNumber}</td>
                                    <td className="px-4 py-2">
                                      {p.boarded ? (
                                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                                          Boarded
                                        </span>
                                      ) : (
                                        <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                          Not Boarded
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {!p.boarded && (
                                        <Button
                                          size="sm"
                                          className="bg-gradient-to-r from-[#009393] to-[#007a7a] text-white rounded shadow hover:from-[#008080] hover:to-[#006666]"
                                          onClick={async () => {
                                            await fetch("/api/validate-ticket/board-passenger", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ passengerId: p.id }),
                                            });
                                            validateTicket(validationResult.orderId);
                                          }}
                                        >
                                          Mark as Boarded
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      onClick={resetValidation}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100/50 rounded-lg"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Another
                    </Button>

                    {validationStatus === "valid" && (
                      <Button 
                        onClick={markAsScanned} 
                        className="bg-gradient-to-r from-[#009393] to-[#007a7a] hover:from-[#008080] hover:to-[#006666] text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                        disabled={scanning}
                      >
                        {scanning ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Boarded
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
    </>
  );
}