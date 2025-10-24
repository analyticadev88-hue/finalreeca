export type RouteDescriptor = {
  serviceType: string;
  departureTime: string;
  origin: string;
  destination: string;
  routeName: string;
  display: string;
};

const BUS_TIME_MAP: Record<string, Array<{ departureTime: string; origin: string; destination: string }>> = {
  'Morning Bus': [
    { departureTime: '07:00', origin: 'Gaborone', destination: 'OR Tambo Airport' },
    { departureTime: '17:00', origin: 'OR Tambo Airport', destination: 'Gaborone' }
  ],
  'Afternoon Bus': [
    { departureTime: '15:00', origin: 'Gaborone', destination: 'OR Tambo Airport' },
    { departureTime: '08:00', origin: 'OR Tambo Airport', destination: 'Gaborone' }
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