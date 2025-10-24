"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRoutesForBuses } from '@/lib/busRoutes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const serviceOptions = ["Morning Bus", "Afternoon Bus"];
const vehicleTypes = [
  { id: 'hiace', name: 'Toyota Hiace', seats: 14, defaultCount: 2 },
  { id: 'sprinter', name: 'Mercedes Sprinter', seats: 25, defaultCount: 1 },
  { id: 'standard', name: 'Standard Bus', seats: 57, defaultCount: 1 }
];

interface VehicleSelection {
  type: string;
  name: string;
  count: number;
  seats: number;
}

export default function CreateCharterModal({ isOpen, onClose, onCreated }: Props) {
  const [selectedBuses, setSelectedBuses] = useState<string[]>(["Morning Bus"]);
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [customRoute, setCustomRoute] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [customFare, setCustomFare] = useState<number | "">("");
  const [totalSeats] = useState(57);
  const [deployReplacement, setDeployReplacement] = useState(true);
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleSelection[]>([
    { type: 'hiace', name: 'Toyota Hiace', count: 2, seats: 14 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictReport, setConflictReport] = useState<Array<any>>([]);
  const [totalMarkedResult, setTotalMarkedResult] = useState<number | null>(null);

  const affectedRoutes = getRoutesForBuses(selectedBuses);
  const totalReplacementSeats = selectedVehicles.reduce((total, vehicle) => 
    total + (vehicle.count * vehicle.seats), 0
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedBuses(["Morning Bus"]);
      setCompany("");
      setStartDate(null);
      setEndDate(null);
      setCustomRoute("");
      setIsRoundTrip(true);
      setCustomFare("");
      setSelectedVehicles([
        { type: 'hiace', name: 'Toyota Hiace', count: 2, seats: 14 }
      ]);
      setError(null);
      setConflictReport([]);
      setTotalMarkedResult(null);
    }
  }, [isOpen]);

  const toggleBus = (b: string) => {
    setSelectedBuses(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const toggleVehicle = (vehicleType: string) => {
    setSelectedVehicles(prev => {
      const exists = prev.find(v => v.type === vehicleType);
      if (exists) {
        return prev.filter(v => v.type !== vehicleType);
      } else {
        const vehicleConfig = vehicleTypes.find(v => v.id === vehicleType);
        if (vehicleConfig) {
          return [...prev, {
            type: vehicleConfig.id,
            name: vehicleConfig.name,
            count: vehicleConfig.defaultCount,
            seats: vehicleConfig.seats
          }];
        }
        return prev;
      }
    });
  };

  const updateVehicleCount = (vehicleType: string, count: number) => {
    setSelectedVehicles(prev => 
      prev.map(vehicle => 
        vehicle.type === vehicleType ? { ...vehicle, count: Math.max(0, count) } : vehicle
      )
    );
  };

  const handleCreate = async () => {
    setError(null);
    if (!company) return setError("Please enter company name");
    if (!startDate) return setError("Please select start date");
    if (!endDate) return setError("Please select end date");
    if (!customRoute) return setError("Please enter a custom route");
    if (!customFare) return setError("Please enter a custom fare");
    if (deployReplacement && selectedVehicles.length === 0) {
      return setError("Please select at least one vehicle type for replacement");
    }

    setIsSubmitting(true);
    try {
      const body = {
        buses: selectedBuses,
        company,
        startDate,
        endDate,
        customRoute,
        isRoundTrip,
        customFare: Number(customFare),
        totalSeats,
        deployReplacement,
        replacementVehicles: selectedVehicles,
      };

      const res = await fetch('/api/charters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || 'Failed to create charter');
      }

      const json = await res.json().catch(() => ({}));
      if (json?.conflictReport) setConflictReport(json.conflictReport);
      if (typeof json?.totalMarked === 'number') setTotalMarkedResult(json.totalMarked);

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#009393] to-[#007575] p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">Create Charter Booking</DialogTitle>
            </div>
            <p className="text-white/80 text-sm font-light">Book corporate charters and manage replacement services</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Bus Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 tracking-wide">PHYSICAL BUS TO CHARTER</label>
            <div className="flex space-x-4">
              {serviceOptions.map(b => (
                <button
                  key={b}
                  onClick={() => toggleBus(b)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedBuses.includes(b)
                      ? 'border-[#009393] bg-[#009393]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBuses.includes(b) ? 'border-[#009393] bg-[#009393]' : 'border-gray-300'
                    }`}>
                      {selectedBuses.includes(b) && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      selectedBuses.includes(b) ? 'text-[#009393]' : 'text-gray-600'
                    }`}>
                      {b}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Report */}
          {conflictReport && conflictReport.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-yellow-800">Replacement deployment report</div>
                  <div className="text-sm text-yellow-700">Total regular trips marked: {totalMarkedResult ?? 0}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {conflictReport.map((c, idx) => (
                  <div key={idx} className="text-sm text-yellow-800">
                    <span className="font-medium">{c.date}:</span> {c.route} {c.departureTime ? `(${c.departureTime})` : ''} — matched {c.matched}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company & Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">COMPANY</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#009393] focus:ring-2 focus:ring-[#009393]/20 transition-all duration-200"
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">CHARTER DATES</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={startDate ?? ''}
                  onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#009393] focus:ring-2 focus:ring-[#009393]/20 transition-all duration-200"
                />
                <input
                  type="date"
                  value={endDate ?? ''}
                  onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#009393] focus:ring-2 focus:ring-[#009393]/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Custom Route */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 tracking-wide">CUSTOM ROUTE</label>
            <input
              value={customRoute}
              onChange={e => setCustomRoute(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#009393] focus:ring-2 focus:ring-[#009393]/20 transition-all duration-200"
              placeholder="Enter custom route details"
            />
          </div>

          {/* Trip Type */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 tracking-wide">TRIP TYPE</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsRoundTrip(true)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                  isRoundTrip
                    ? 'border-[#009393] bg-[#009393]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`font-medium ${
                  isRoundTrip ? 'text-[#009393]' : 'text-gray-600'
                }`}>
                  Round Trip
                </span>
              </button>
              <button
                onClick={() => setIsRoundTrip(false)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                  !isRoundTrip
                    ? 'border-[#009393] bg-[#009393]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`font-medium ${
                  !isRoundTrip ? 'text-[#009393]' : 'text-gray-600'
                }`}>
                  One Way
                </span>
              </button>
            </div>
          </div>

          {/* Fare & Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">CUSTOM FARE (P)</label>
              <input
                type="number"
                value={customFare as any}
                onChange={e => setCustomFare(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#009393] focus:ring-2 focus:ring-[#009393]/20 transition-all duration-200"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">CHARTER SEATS</label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-semibold text-gray-700">{totalSeats} seats</span>
                <span className="text-gray-500 text-sm ml-2">(full bus capacity)</span>
              </div>
            </div>
          </div>

          {/* Replacement Section */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={deployReplacement}
                  onChange={e => setDeployReplacement(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-all duration-200 ${
                  deployReplacement ? 'bg-[#009393]' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    deployReplacement ? 'translate-x-5' : ''
                  }`} />
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">ACTIVATE REPLACEMENT VEHICLES</span>
                <p className="text-gray-500 text-sm">Deploy replacement services for affected routes</p>
              </div>
            </label>

            {deployReplacement && (
              <div className="space-y-4 pl-2 border-l-2 border-[#009393]/20 ml-2">
                {/* Affected Routes */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 tracking-wide">AFFECTED REGULAR ROUTES</label>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {affectedRoutes.length === 0 ? (
                      <p className="text-gray-500 text-sm">No routes selected</p>
                    ) : (
                      affectedRoutes.map((route, index) => (
                        <div key={route} className="flex items-center space-x-3 py-1">
                          <div className="w-2 h-2 rounded-full bg-[#009393]" />
                          <span className="text-sm text-gray-700">{route}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 tracking-wide">SELECT REPLACEMENT VEHICLES</label>
                  <div className="grid grid-cols-1 gap-3">
                    {vehicleTypes.map(vehicle => {
                      const isSelected = selectedVehicles.find(v => v.type === vehicle.id);
                      return (
                        <div key={vehicle.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-[#009393]/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleVehicle(vehicle.id)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-[#009393] bg-[#009393]' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </button>
                            <div>
                              <div className="font-medium text-gray-800">{vehicle.name}</div>
                              <div className="text-sm text-gray-500">{vehicle.seats} seats per vehicle</div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateVehicleCount(vehicle.id, (isSelected?.count || 1) - 1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-gray-600">-</span>
                              </button>
                              <span className="w-8 text-center font-medium">{isSelected.count}</span>
                              <button
                                onClick={() => updateVehicleCount(vehicle.id, (isSelected?.count || 0) + 1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-gray-600">+</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Capacity */}
                <div className="bg-gradient-to-r from-[#009393]/5 to-[#007575]/5 rounded-xl p-4 border border-[#009393]/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Vehicle Summary</span>
                    <span className="font-bold text-xl text-[#009393]">{totalReplacementSeats} seats</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {selectedVehicles.map(vehicle => (
                      <div key={vehicle.type} className="flex justify-between">
                        <span>{vehicle.name}:</span>
                        <span>{vehicle.count} × {vehicle.seats} = {vehicle.count * vehicle.seats} seats</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Total capacity per affected route</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#009393] to-[#007575] text-white font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Charter...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Block & Deploy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}