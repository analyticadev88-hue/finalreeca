export type RouteDescriptor = {
  serviceType: string;
  departureTime: string;
  origin: string;
  destination: string;
  routeName: string;
  display: string;
};

import { isCorridorRoute } from './tripParent';

export function getServiceTypeFromDepartureTime(departureTime: string): string {
  const time = (departureTime || '00:00').trim();
  const [hourText] = time.split(':');
  const hour = Number.parseInt(hourText || '0', 10);

  if (Number.isNaN(hour)) return 'Morning Bus';
  if (hour < 12) return 'Morning Bus';
  if (hour < 17) return 'Afternoon Bus';
  return 'Night Bus';
}

/**
 * Label a trip for display. The Gaborone ↔ Maun corridor runs a single night
 * bus per direction — even segment trips that board just after midnight
 * (e.g. Kang 00:00) are part of that night run, so time-of-day derivation
 * alone would mislabel them "Morning Bus".
 */
export function resolveDisplayServiceType(trip: {
  departureTime?: string;
  serviceType?: string;
  routeOrigin?: string;
  routeDestination?: string;
}): string {
  if (trip.routeOrigin && trip.routeDestination && isCorridorRoute(trip.routeOrigin, trip.routeDestination)) {
    return 'Night Bus';
  }
  return getServiceTypeFromDepartureTime(trip.departureTime || trip.serviceType || '00:00');
}

const BUS_TIME_MAP: Record<string, Array<{ departureTime: string; origin: string; destination: string }>> = {
  'Morning Bus': [
    { departureTime: '07:00', origin: 'Gaborone', destination: 'OR Tambo Airport' },
    { departureTime: '07:00', origin: 'Gaborone', destination: 'Rustenburg' },
    { departureTime: '09:30', origin: 'Rustenburg', destination: 'OR Tambo Airport' },
    { departureTime: '17:00', origin: 'OR Tambo Airport', destination: 'Gaborone' },
    { departureTime: '19:30', origin: 'OR Tambo Airport', destination: 'Rustenburg' },
    { departureTime: '17:00', origin: 'Rustenburg', destination: 'Gaborone' }
  ],
  'Afternoon Bus': [
    { departureTime: '15:00', origin: 'Gaborone', destination: 'OR Tambo Airport' },
    { departureTime: '15:00', origin: 'Gaborone', destination: 'Rustenburg' },
    { departureTime: '17:30', origin: 'Rustenburg', destination: 'OR Tambo Airport' },
    { departureTime: '08:00', origin: 'OR Tambo Airport', destination: 'Gaborone' },
    { departureTime: '10:30', origin: 'OR Tambo Airport', destination: 'Rustenburg' },
    { departureTime: '08:00', origin: 'Rustenburg', destination: 'Gaborone' }
  ],
  'Night Bus': [
    { departureTime: '18:00', origin: 'Gaborone', destination: 'Maun' },
    { departureTime: '17:30', origin: 'Maun', destination: 'Gaborone' }
  ]
};

export function getRouteDescriptors(selected: string[]): RouteDescriptor[] {
  const out: RouteDescriptor[] = [];
  
  // FIXED: Removed redundant duplication - just use the selected buses directly
  for (const s of selected) {
    const list = BUS_TIME_MAP[s] || [];
    for (const item of list) {
      const routeName = `${item.origin} → ${item.destination}`;
      const display = `${routeName} (${item.departureTime})`;
      out.push({ 
        serviceType: s, 
        departureTime: item.departureTime, 
        origin: item.origin, 
        destination: item.destination, 
        routeName, 
        display 
      });
    }
  }
  
  // dedupe by serviceType+departureTime+origin+destination
  const seen = new Set<string>();
  return out.filter(d => {
    const k = `${d.serviceType}|${d.departureTime}|${d.origin}|${d.destination}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function getRoutesForBuses(selectedBuses: string[]) {
  return getRouteDescriptors(selectedBuses).map(d => d.display);
}