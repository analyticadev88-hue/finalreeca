'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Bus as BusIcon,
  Ticket as TicketIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  Plus as PlusIcon,
  Edit2 as EditIcon,
  Trash2 as TrashIcon,
  ArrowRight as ArrowRightIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, addDays } from 'date-fns';

// Define color variables based on company colors
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#f5f5f5',         // Light gray
  dark: '#1a1a1a',          // Dark gray
  light: '#ffffff',         // White
  destructive: '#ef4444'    // Red (kept for errors)
};

interface Trip {
  id?: string;
  serviceType: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string | Date;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  reservedSeatsCount?: number;
  reservedBy?: string | null;
  reservationNotes?: string | null;
  fare: number;
  durationMinutes: number;
  boardingPoint: string;
  droppingPoint: string;
  promoActive: boolean;
  hasDeparted: boolean;
  parentTripId?: string | null;
}

interface Route {
  id: string;
  name: string;
}

interface Time {
  id: string;
  time: string;
}

interface TripFormProps {
  trip: Trip | null;
  onSave: (trip: Trip) => void;
  routes: Route[];
  times: Time[];
  allTrips?: Trip[];
}

interface AutomateTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trips: Trip[], startDate: string, endDate: string) => void;
  routes: Route[];
  times: Time[];
  lastTripDate: string | null;
}

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  routes: Route[];
  times: Time[];
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
  </div>
);

const ErrorModal = ({ message, onClose }: { message: string | null; onClose: () => void }) => (
  <Dialog open={!!message} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-destructive">Error</DialogTitle>
        <DialogDescription>An error occurred while processing your request.</DialogDescription>
      </DialogHeader>
      <div className="bg-destructive/10 p-4 rounded-md">
        <p className="text-destructive">{message}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ isOpen, onClose, onSave, routes, times }) => {
  const [updateType, setUpdateType] = useState('');
  const [filters, setFilters] = useState({
    routeName: 'all',
    startDate: '',
    endDate: '',
    hasDeparted: false
  });
  const [updates, setUpdates] = useState({
    fare: '',
    availableSeats: '',
    totalSeats: '',
    durationMinutes: '',
    serviceType: 'keep-current',
    departureTime: 'keep-current',
    boardingPoint: '',
    droppingPoint: ''
  });

  const handleSave = () => {
    onSave({ filters, updates, updateType });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bulk Update Trips</DialogTitle>
          <DialogDescription>
            Update multiple trips at once based on your selected filters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Select which trips to update</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <Select value={filters.routeName} onValueChange={(value) => setFilters({...filters, routeName: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All routes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All routes</SelectItem>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      placeholder="End date"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDeparted"
                    checked={filters.hasDeparted}
                    onCheckedChange={(checked) => setFilters({...filters, hasDeparted: checked as boolean})}
                  />
                  <label htmlFor="includeDeparted" className="text-sm font-medium leading-none">
                    Include Departed Trips
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Updates</CardTitle>
              <CardDescription>Specify the changes to apply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fare</label>
                  <Input
                    type="number"
                    value={updates.fare}
                    onChange={(e) => setUpdates({...updates, fare: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available Seats</label>
                  <Input
                    type="number"
                    value={updates.availableSeats}
                    onChange={(e) => setUpdates({...updates, availableSeats: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Seats</label>
                  <Input
                    type="number"
                    value={updates.totalSeats}
                    onChange={(e) => setUpdates({...updates, totalSeats: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (Minutes)</label>
                  <Input
                    type="number"
                    value={updates.durationMinutes}
                    onChange={(e) => setUpdates({...updates, durationMinutes: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service Type</label>
                  <Select value={updates.serviceType} onValueChange={(value) => setUpdates({...updates, serviceType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-current">Keep current</SelectItem>
                      <SelectItem value="Morning Bus">Morning Bus</SelectItem>
                      <SelectItem value="Afternoon Bus">Afternoon Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Time</label>
                  <Select value={updates.departureTime} onValueChange={(value) => setUpdates({...updates, departureTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-current">Keep current</SelectItem>
                      {times.map((time) => (
                        <SelectItem key={time.id} value={time.time}>{time.time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Boarding Point</label>
                  <Input
                    value={updates.boardingPoint}
                    onChange={(e) => setUpdates({...updates, boardingPoint: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dropping Point</label>
                  <Input
                    value={updates.droppingPoint}
                    onChange={(e) => setUpdates({...updates, droppingPoint: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} style={{ backgroundColor: colors.primary }}>
              Apply Updates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AutomateTripsModal: React.FC<AutomateTripsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  routes,
  times,
  lastTripDate
}) => {
  const [baseTrips, setBaseTrips] = useState<Trip[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default start date to day after last trip or today
      const defaultStartDate = lastTripDate ?
        format(addDays(parseISO(lastTripDate), 1), 'yyyy-MM-dd') :
        format(new Date(), 'yyyy-MM-dd');
      setStartDate(defaultStartDate);
      // Set default end date to 6 months from start
      const defaultEndDate = format(addDays(new Date(), 180), 'yyyy-MM-dd');
      setEndDate(defaultEndDate);

      const initialBaseTrips: Trip[] = [
        {
          routeName: 'Gaborone to OR Tambo Airport',
          departureTime: '07:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Mogobe Plaza',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'Gaborone to OR Tambo Airport',
          departureTime: '15:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Mogobe Plaza',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'OR Tambo Airport to Gaborone',
          departureTime: '08:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Mogobe Plaza',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'OR Tambo Airport to Gaborone',
          departureTime: '17:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Mogobe Plaza',
          departureDate: new Date().toISOString()
        },
      ];
      setBaseTrips(initialBaseTrips);
    }
  }, [isOpen, lastTripDate]);

  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedBaseTrips = [...baseTrips];
    updatedBaseTrips[index] = { ...updatedBaseTrips[index], [field]: value };
    setBaseTrips(updatedBaseTrips);
  };

  const handleSave = () => {
    onSave(baseTrips, startDate, endDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Generate Scheduled Trips</DialogTitle>
          <DialogDescription>
            Automatically create trips for a date range based on templates
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {lastTripDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last trip in database: {format(parseISO(lastTripDate), 'PPP')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Trip Templates</h3>
            <div className="space-y-4">
              {baseTrips.map((trip, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <CardTitle className="text-base">
                        {trip.routeName} <ArrowRightIcon className="inline mx-1 h-4 w-4" /> {trip.departureTime}
                      </CardTitle>
                      <Badge variant="outline" style={{ backgroundColor: colors.accent, color: colors.light }}>
                        {trip.serviceType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Available Seats</label>
                        <Input
                          type="number"
                          value={trip.availableSeats}
                          onChange={(e) => handleInputChange(index, 'availableSeats', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Total Seats</label>
                        <Input
                          type="number"
                          value={trip.totalSeats}
                          onChange={(e) => handleInputChange(index, 'totalSeats', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fare (Pula)</label>
                        <Input
                          type="number"
                          value={trip.fare}
                          onChange={(e) => handleInputChange(index, 'fare', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (min)</label>
                        <Input
                          type="number"
                          value={trip.durationMinutes}
                          onChange={(e) => handleInputChange(index, 'durationMinutes', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">Boarding Point</label>
                        <Input
                          value={trip.boardingPoint}
                          onChange={(e) => handleInputChange(index, 'boardingPoint', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">Dropping Point</label>
                        <Input
                          value={trip.droppingPoint}
                          onChange={(e) => handleInputChange(index, 'droppingPoint', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2 sm:col-span-2">
                        <Checkbox
                          id={`promoActive-${index}`}
                          checked={trip.promoActive}
                          onCheckedChange={(checked) => handleInputChange(index, 'promoActive', checked)}
                        />
                        <label htmlFor={`promoActive-${index}`} className="text-sm font-medium leading-none">
                          Promo Active
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} style={{ backgroundColor: colors.primary }}>
              Generate Trips
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TripForm: React.FC<TripFormProps> = ({ trip, onSave, routes, times }) => {
  const [formData, setFormData] = useState<Trip>(
    trip || {
      routeName: '',
      departureDate: new Date().toISOString(),
      departureTime: '',
      totalSeats: 60,
      availableSeats: 60,
      serviceType: 'Morning Bus',
      fare: 500,
      durationMinutes: 390,
      promoActive: false,
      hasDeparted: false,
      routeOrigin: '',
      routeDestination: '',
      boardingPoint: '',
      droppingPoint: '',
      parentTripId: '',
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const potentialParents = (allTrips || []).filter(t => 
    t.id !== trip?.id && 
    t.departureTime === formData.departureTime &&
    new Date(t.departureDate).toDateString() === new Date(formData.departureDate).toDateString()
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Route</label>
          <Select
            onValueChange={(value) => {
              setFormData({ ...formData, routeName: value });
            }}
            value={formData.routeName}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Parent Trip (Optional)</label>
          <Select
            onValueChange={(value) => {
              setFormData({ ...formData, parentTripId: value === 'none' ? '' : value });
            }}
            value={formData.parentTripId || 'none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Standalone trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Standalone trip (own seats)</SelectItem>
              {potentialParents.map((p) => (
                <SelectItem key={p.id} value={p.id!}>
                  {p.routeName} — {p.departureTime} ({p.availableSeats}/{p.totalSeats} seats)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Link to a parent to share its seat inventory. Same date & time only.
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="departureDate"
              type="date"
              value={new Date(formData.departureDate).toISOString().split('T')[0]}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  departureDate: new Date(e.target.value).toISOString()
                });
              }}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Departure Time</label>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Select
              onValueChange={(value) => {
                setFormData({ ...formData, departureTime: value });
              }}
              value={formData.departureTime}
              required
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {times.map((time) => (
                  <SelectItem key={time.id} value={time.time}>{time.time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Service Type</label>
          <Select
            onValueChange={(value) => {
              setFormData({ ...formData, serviceType: value });
            }}
            value={formData.serviceType}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning Bus">Morning Bus</SelectItem>
              <SelectItem value="Afternoon Bus">Afternoon Bus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Available Seats</label>
          <Input
            name="availableSeats"
            type="number"
            value={formData.availableSeats}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Total Seats</label>
          <Input
            name="totalSeats"
            type="number"
            value={formData.totalSeats}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Fare (Pula)</label>
          <Input
            name="fare"
            type="number"
            value={formData.fare}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Duration (Minutes)</label>
          <Input
            name="durationMinutes"
            type="number"
            value={formData.durationMinutes}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Route Origin</label>
          <Input
            name="routeOrigin"
            value={formData.routeOrigin || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Route Destination</label>
          <Input
            name="routeDestination"
            value={formData.routeDestination || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Boarding Point</label>
          <Input
            name="boardingPoint"
            value={formData.boardingPoint || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Dropping Point</label>
          <Input
            name="droppingPoint"
            value={formData.droppingPoint || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="promoActive"
            checked={formData.promoActive}
            onCheckedChange={(checked: boolean) => {
              setFormData({ ...formData, promoActive: checked });
            }}
          />
          <label htmlFor="promoActive" className="text-sm font-medium leading-none">
            Promo Active
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasDeparted"
            checked={formData.hasDeparted}
            onCheckedChange={(checked: boolean) => {
              setFormData({ ...formData, hasDeparted: checked });
            }}
            disabled={!!trip}
          />
          <label htmlFor="hasDeparted" className="text-sm font-medium leading-none">
            Has Departed
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" className="w-full md:w-auto" style={{ backgroundColor: colors.primary }}>
          {trip ? 'Update Trip' : 'Create Trip'}
        </Button>
      </div>
    </form>
  );
};

// Reserve Seats Modal
const ReserveSeatsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onReserved: (updatedTrip: Partial<Trip>) => void;
}> = ({ isOpen, onClose, trip, onReserved }) => {
  const [clientName, setClientName] = useState('');
  const [seatsToReserve, setSeatsToReserve] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [liaisonPerson, setLiaisonPerson] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setClientName('');
      setSeatsToReserve(1);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!trip) return null;

  const reservedCount = trip.reservedSeatsCount || 0;
  const availableForReserve = Math.max(0, (trip.availableSeats || 0) - reservedCount);

  const handleSubmit = async () => {
    setError(null);
    if (!clientName) return setError('Client name is required');
    if (seatsToReserve <= 0) return setError('Enter a valid number of seats');
    if (seatsToReserve > availableForReserve) return setError('Not enough available seats to reserve');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trips/reserve-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId: trip.id, clientName, seats: seatsToReserve, notes, contactPhone, contactEmail, liaisonPerson, company })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to reserve seats');
      }
      const data = await res.json();
      // Notify parent to update trip in UI
      onReserved({
        reservedSeatsCount: data.reservedSeatsCount,
        reservedBy: data.reservedBy || clientName,
        reservationNotes: data.reservationNotes || notes,
        availableSeats: data.availableSeats !== undefined ? data.availableSeats : trip.availableSeats,
      });
    } catch (err: any) {
      setError(err?.message || 'Reservation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve Seats</DialogTitle>
          <DialogDescription>Block seats for a client so they cannot be booked by others.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <Input value={clientName} onChange={(e) => setClientName((e.target as HTMLInputElement).value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <Input value={contactPhone} onChange={(e) => setContactPhone((e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <Input value={contactEmail} onChange={(e) => setContactEmail((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Liaison Person</label>
              <Input value={liaisonPerson} onChange={(e) => setLiaisonPerson((e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <Input value={company} onChange={(e) => setCompany((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seats to reserve</label>
            <Input type="number" min={1} max={availableForReserve} value={seatsToReserve} onChange={(e) => setSeatsToReserve(Number(e.target.value))} />
            <p className="text-sm text-muted-foreground mt-1">Available: <strong style={{ color: colors.primary }}>{availableForReserve}</strong> (Calculated as availableSeats - reservedSeats)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} style={{ backgroundColor: colors.primary }} disabled={isSubmitting || seatsToReserve <= 0 || seatsToReserve > availableForReserve}>
              Reserve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FleetManagementPage = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutomateModalOpen, setIsAutomateModalOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveModalTrip, setReserveModalTrip] = useState<Trip | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDepart, setAutoDepart] = useState(true);
  const [lastTripDate, setLastTripDate] = useState<string | null>(null);

  const routes: Route[] = [
    { id: '1', name: 'Gaborone to OR Tambo Airport' },
    { id: '2', name: 'OR Tambo Airport to Gaborone' },
    { id: '3', name: 'Gaborone to Rustenburg' },
    { id: '4', name: 'Rustenburg to Gaborone' },
    { id: '5', name: 'Rustenburg to OR Tambo Airport' },
    { id: '6', name: 'OR Tambo Airport to Rustenburg' },
  ];

  const times: Time[] = [
    { id: '1', time: '07:00' },
    { id: '2', time: '15:00' },
    { id: '3', time: '08:00' },
    { id: '4', time: '17:00' },
    { id: '5', time: '09:30' },
    { id: '6', time: '17:30' },
    { id: '7', time: '19:30' },
    { id: '8', time: '10:30' },
  ];

  useEffect(() => {
    fetchTrips();
    fetchLastTripDate();
  }, []);

  useEffect(() => {
    if (!autoDepart) return;
    const interval = setInterval(() => {
      const now = new Date();
      // Only check trips for today and tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      trips.forEach(trip => {
        const tripDate = new Date(trip.departureDate);
        if (
          !trip.hasDeparted &&
          trip.id &&
          trip.departureDate &&
          trip.departureTime &&
          tripDate >= today &&
          tripDate <= tomorrow
        ) {
          try {
            const [hours, minutes] = trip.departureTime.split(":").map(Number);
            tripDate.setHours(hours, minutes, 0, 0);
            if (now >= tripDate) {
              handleMarkDeparted(trip.id);
            }
          } catch (error) {
            console.error('Error processing trip departure:', error);
          }
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [autoDepart, trips]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLastTripDate = async () => {
    try {
      const response = await fetch('/api/trips/last-date');
      if (response.ok) {
        const data = await response.json();
        setLastTripDate(data.lastTripDate);
      }
    } catch (error) {
      console.error('Error fetching last trip date:', error);
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error('Failed to bulk update trips');
      }
      const result = await response.json();
      fetchTrips();
      alert(`Bulk update successful. ${result.updatedCount} trips updated.`);
    } catch (error) {
      console.error('Error bulk updating trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to bulk update trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateTrips = () => {
    setIsAutomateModalOpen(true);
  };

  const handleSaveAutomatedTrips = async (baseTrips: Trip[], startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // Generate all the trips data
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const tripsToCreate: any[] = [];

      // Generate dates between start and end
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);

        // For each date, create trips based on base templates
        baseTrips.forEach(baseTrip => {
          const [hours, minutes] = baseTrip.departureTime.split(':').map(Number);
          const departureDateTime = new Date(currentDate);
          departureDateTime.setHours(hours, minutes, 0, 0);
          tripsToCreate.push({
            serviceType: baseTrip.serviceType,
            routeName: baseTrip.routeName,
            routeOrigin: baseTrip.routeOrigin,
            routeDestination: baseTrip.routeDestination,
            departureDate: departureDateTime.toISOString(),
            departureTime: baseTrip.departureTime,
            totalSeats: baseTrip.totalSeats,
            availableSeats: baseTrip.availableSeats,
            fare: baseTrip.fare,
            durationMinutes: baseTrip.durationMinutes,
            boardingPoint: baseTrip.boardingPoint,
            droppingPoint: baseTrip.droppingPoint,
            promoActive: baseTrip.promoActive,
            hasDeparted: false,
          });
        });
      }

      console.log(`Creating ${tripsToCreate.length} trips...`);

      // Send bulk creation request
      const response = await fetch('/api/trips/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trips: tripsToCreate }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Bulk trip creation error response:", err);
        throw new Error(err.message || 'Failed to bulk create trips');
      }

      const result = await response.json();
      fetchTrips();
      fetchLastTripDate();
      alert(`Successfully created ${result.createdCount} trips from ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error creating automated trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to create automated trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (trip: Trip | null = null) => {
    if (trip && trip.hasDeparted) return;
    setCurrentTrip(trip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTrip(null);
  };

  const handleSaveTrip = async (trip: Trip) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: trip.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trip),
      });
      if (!response.ok) {
        throw new Error('Failed to save trip');
      }
      const data = await response.json();
      setTrips(prevTrips => {
        if (trip.id) {
          return prevTrips.map(t => t.id === trip.id ? data : t);
        } else {
          return [...prevTrips, data];
        }
      });
      handleCloseModal();
    } catch (error) {
      console.error('Error saving trip:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDeparted = async (tripId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tripId, hasDeparted: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark trip as departed');
      }
      const data = await response.json();
      setTrips(prevTrips => prevTrips.map(t => t.id === tripId ? data : t));
    } catch (error) {
      console.error('Error marking trip as departed:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tripId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
      setTrips(prevTrips => prevTrips.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const tripDate = new Date(trip.departureDate);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);
    return tripDate >= selectedDateStart && tripDate <= selectedDateEnd;
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.muted }}>
      <div className="flex-1 flex flex-col">
        <header className="border-b" style={{ backgroundColor: colors.light }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>Fleet Management</h1>
                <p className="text-sm" style={{ color: colors.accent }}>
                  Manage your bus schedules and trips
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-depart"
                    checked={autoDepart}
                    onCheckedChange={setAutoDepart}
                  />
                  <label htmlFor="auto-depart" className="text-sm font-medium leading-none">
                    Auto Depart
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsBulkUpdateModalOpen(true)}
                    variant="outline"
                    className="hidden sm:flex"
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Bulk Update
                  </Button>
                  <Button onClick={handleAutomateTrips} className="hidden sm:flex" style={{ backgroundColor: colors.accent }}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                  <Button onClick={() => handleOpenModal()} style={{ backgroundColor: colors.primary }}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Trip
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm">
                {autoDepart ? (
                  <div className="flex items-center" style={{ color: colors.primary }}>
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: colors.primary, opacity: 0.75 }}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: colors.primary }}></span>
                    </span>
                    Auto Depart is active
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Auto Depart is inactive
                  </div>
                )}
              </div>
              {lastTripDate && (
                <div className="text-sm" style={{ color: colors.accent }}>
                  Last trip in database: {format(parseISO(lastTripDate), 'PPP')}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 flex-1">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Tabs defaultValue="schedule">
              <TabsList className="grid w-full grid-cols-2 max-w-md" style={{ backgroundColor: colors.light }}>
                <TabsTrigger value="schedule" style={{ color: colors.dark }}>
                  <ClockIcon className="mr-2 h-4 w-4" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="timetable" style={{ color: colors.dark }}>
                  <BusIcon className="mr-2 h-4 w-4" />
                  Timetable
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="mt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.dark }}>Daily Schedule</h2>
                    <p className="text-sm" style={{ color: colors.accent }}>
                      Trips for {format(selectedDate, 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.accent }} />
                      <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="pl-10 w-[180px]"
                        style={{ borderColor: colors.accent }}
                      />
                    </div>
                  </div>
                </div>
                {filteredTrips.length === 0 ? (
                  <Card style={{ backgroundColor: colors.light }}>
                    <CardContent className="py-8 text-center">
                      <TicketIcon className="mx-auto h-8 w-8 mb-2" style={{ color: colors.accent }} />
                      <h3 className="text-lg font-medium" style={{ color: colors.dark }}>No trips scheduled</h3>
                      <p className="text-sm mt-1" style={{ color: colors.accent }}>
                        There are no trips scheduled for this date.
                      </p>
                      <Button onClick={() => handleOpenModal()} className="mt-4" style={{ backgroundColor: colors.primary }}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Trip
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader style={{ backgroundColor: colors.muted }}>
                          <TableRow>
                            <TableHead className="min-w-[150px]" style={{ color: colors.dark }}>Route</TableHead>
                            <TableHead style={{ color: colors.dark }}>Date</TableHead>
                            <TableHead style={{ color: colors.dark }}>Time</TableHead>
                            <TableHead style={{ color: colors.dark }}>Service</TableHead>
                            <TableHead className="text-right" style={{ color: colors.dark }}>Seats</TableHead>
                            <TableHead style={{ color: colors.dark }}>Reserved</TableHead>
                            <TableHead className="text-right" style={{ color: colors.dark }}>Fare</TableHead>
                            <TableHead style={{ color: colors.dark }}>Status</TableHead>
                            <TableHead style={{ color: colors.dark }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrips.map((trip) => (
                            <TableRow key={trip.id} style={{ backgroundColor: trip.hasDeparted ? colors.muted : colors.light }}>
                              <TableCell className="font-medium" style={{ color: colors.dark }}>
                                <div className="flex items-center">
                                  <BusIcon className="mr-2 h-4 w-4" style={{ color: colors.accent }} />
                                  <span className="truncate max-w-[120px]">{trip.routeName}</span>
                                </div>
                              </TableCell>
                              <TableCell style={{ color: colors.dark }}>{format(new Date(trip.departureDate), 'PP')}</TableCell>
                              <TableCell style={{ color: colors.dark }}>{trip.departureTime}</TableCell>
                              <TableCell>
                                <Badge variant="outline" style={{ backgroundColor: colors.accent, color: colors.light }}>
                                  {trip.serviceType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span style={{ color: trip.availableSeats < 10 ? colors.destructive : colors.dark, fontWeight: trip.availableSeats < 10 ? '600' : 'normal' }}>
                                  {trip.availableSeats}/{trip.totalSeats}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge style={{ backgroundColor: colors.secondary, color: colors.dark }}>
                                  {trip.reservedSeatsCount || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right" style={{ color: colors.dark }}>P{trip.fare}</TableCell>
                              <TableCell>
                                <Badge variant={trip.hasDeparted ? 'secondary' : 'default'} style={{
                                  backgroundColor: trip.hasDeparted ? colors.accent : colors.primary,
                                  color: colors.light
                                }}>
                                  {trip.hasDeparted ? 'Departed' : 'Scheduled'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenModal(trip)}
                                    disabled={trip.hasDeparted}
                                    style={{ color: colors.primary }}
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                  {!trip.hasDeparted && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMarkDeparted(trip.id!)}
                                        style={{ color: colors.secondary }}
                                      >
                                        <ArrowRightIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTrip(trip.id!)}
                                        style={{ color: colors.destructive }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="timetable" className="mt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.dark }}>Route Timetable</h2>
                    <p className="text-sm" style={{ color: colors.accent }}>
                      View trips by route and date
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Select onValueChange={setSelectedRoute} value={selectedRoute}>
                      <SelectTrigger className="w-full sm:w-[200px]" style={{ borderColor: colors.accent }}>
                        <SelectValue placeholder="All routes" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.light }}>
                        <SelectItem value="all">All routes</SelectItem>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.accent }} />
                      <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="pl-10 w-full sm:w-[180px]"
                        style={{ borderColor: colors.accent }}
                      />
                    </div>
                  </div>
                </div>
                {filteredTrips.filter(trip => selectedRoute === "all" || !selectedRoute ? true : trip.routeName === selectedRoute).length === 0 ? (
                  <Card style={{ backgroundColor: colors.light }}>
                    <CardContent className="py-8 text-center">
                      <MapPinIcon className="mx-auto h-8 w-8 mb-2" style={{ color: colors.accent }} />
                      <h3 className="text-lg font-medium" style={{ color: colors.dark }}>No trips found</h3>
                      <p className="text-sm mt-1" style={{ color: colors.accent }}>
                        There are no trips scheduled for this route and date.
                      </p>
                      <Button onClick={() => handleOpenModal()} className="mt-4" style={{ backgroundColor: colors.primary }}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Trip
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader style={{ backgroundColor: colors.muted }}>
                          <TableRow>
                            <TableHead className="min-w-[150px]" style={{ color: colors.dark }}>Route</TableHead>
                            <TableHead style={{ color: colors.dark }}>Date</TableHead>
                            <TableHead style={{ color: colors.dark }}>Time</TableHead>
                            <TableHead style={{ color: colors.dark }}>Service</TableHead>
                            <TableHead className="text-right" style={{ color: colors.dark }}>Seats</TableHead>
                            <TableHead style={{ color: colors.dark }}>Boarding</TableHead>
                            <TableHead style={{ color: colors.dark }}>Dropping</TableHead>
                            <TableHead style={{ color: colors.dark }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrips
                            .filter(trip => selectedRoute === "all" || !selectedRoute ? true : trip.routeName === selectedRoute)
                            .map((trip) => (
                              <TableRow key={trip.id} style={{ backgroundColor: trip.hasDeparted ? colors.muted : colors.light }}>
                                <TableCell className="font-medium" style={{ color: colors.dark }}>
                                  <div className="flex items-center">
                                    <BusIcon className="mr-2 h-4 w-4" style={{ color: colors.accent }} />
                                    <span className="truncate max-w-[120px]">{trip.routeName}</span>
                                  </div>
                                </TableCell>
                                <TableCell style={{ color: colors.dark }}>{format(new Date(trip.departureDate), 'PP')}</TableCell>
                                <TableCell style={{ color: colors.dark }}>{trip.departureTime}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" style={{ backgroundColor: colors.accent, color: colors.light }}>
                                    {trip.serviceType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span style={{ color: trip.availableSeats < 10 ? colors.destructive : colors.dark, fontWeight: trip.availableSeats < 10 ? '600' : 'normal' }}>
                                    {trip.availableSeats}/{trip.totalSeats}
                                  </span>
                                </TableCell>
                                <TableCell style={{ color: colors.dark }} className="truncate max-w-[100px]">{trip.boardingPoint}</TableCell>
                                <TableCell style={{ color: colors.dark }} className="truncate max-w-[100px]">{trip.droppingPoint}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenModal(trip)}
                                      disabled={trip.hasDeparted}
                                      style={{ color: colors.primary }}
                                    >
                                      <EditIcon className="h-4 w-4" />
                                    </Button>
                                    {!trip.hasDeparted && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setReserveModalTrip(trip); setIsReserveModalOpen(true); }}
                                        style={{ color: colors.primary }}
                                      >
                                        Reserve
                                      </Button>
                                    )}
                                    {!trip.hasDeparted && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTrip(trip.id!)}
                                        style={{ color: colors.destructive }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
      {/* Trip Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[80vh]" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.dark }}>{currentTrip ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
            <DialogDescription style={{ color: colors.accent }}>
              {currentTrip ? 'Update the trip details' : 'Add a new trip to the schedule'}
            </DialogDescription>
          </DialogHeader>
          {currentTrip && currentTrip.hasDeparted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ClockIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-semibold" style={{ color: colors.dark }}>Trip Has Departed</h3>
              <p className="mt-2 text-sm" style={{ color: colors.accent }}>
                This trip has already departed and cannot be edited.
              </p>
            </div>
          ) : (
            <TripForm
              trip={currentTrip}
              onSave={handleSaveTrip}
              routes={routes}
              times={times}
              allTrips={trips}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Automate Trips Modal */}
      <AutomateTripsModal
        isOpen={isAutomateModalOpen}
        onClose={() => setIsAutomateModalOpen(false)}
        onSave={handleSaveAutomatedTrips}
        routes={routes}
        times={times}
        lastTripDate={lastTripDate}
      />
      {/* Reserve Seats Modal */}
      <ReserveSeatsModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        trip={reserveModalTrip}
        onReserved={async (updated) => {
          // update trips list locally: merge by id
          setTrips(prev => prev.map(t => (t.id === reserveModalTrip?.id ? { ...t, ...updated } : t)));
          setIsReserveModalOpen(false);
          toast({ title: 'Seats reserved', description: `${updated.reservedSeatsCount || 0} seats reserved` });
        }}
      />
      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        onSave={handleBulkUpdate}
        routes={routes}
        times={times}
      />
      {/* Error Modal */}
      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
};

export default FleetManagementPage;
