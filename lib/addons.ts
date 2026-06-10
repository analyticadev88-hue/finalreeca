/**
 * Addon Catalog — single source of truth for bookable add-ons.
 * These match exactly what customers see on the passenger details page.
 */

export interface AddonDefinition {
  id: string;
  name: string;
  category: "meal" | "service" | "luggage";
  price: number; // BWP
  unitLabel: string; // e.g. "per passenger" or "for 2 people"
  description?: string;
}

export interface BookingAddonItem {
  catalogId: string;
  name: string;
  category?: string;
  pricePerUnit: number; // same as AddonDefinition.price at time of adding
  quantity: number;     // how many units (passengers or packages)
  totalPrice: number;   // pricePerUnit * quantity
  addedAt: string;      // ISO string
  addedBy?: string;
}

/** Real addons from the customer booking flow (app/booking/passengerdetails/page.tsx) */
export const ADDON_CATALOG: AddonDefinition[] = [
  {
    id: "extraBaggage",
    name: "Extra Baggage",
    category: "luggage",
    price: 300,
    unitLabel: "per passenger",
    description: "Additional baggage allowance for your trip",
  },
  {
    id: "wimpyMeal1",
    name: "Wimpy Meal for 1",
    category: "meal",
    price: 67,
    unitLabel: "per passenger",
    description: "Wimpy meal for 1 person",
  },
  {
    id: "wimpyMeal2",
    name: "Wimpy Meal for 2",
    category: "meal",
    price: 137,
    unitLabel: "for 2 people",
    description: "Wimpy combo meal shared for 2 people",
  },
  {
    id: "travelInsurance",
    name: "Travel Insurance",
    category: "service",
    price: 450,
    unitLabel: "per passenger",
    description: "Comprehensive travel insurance coverage",
  },
];

/** Get an addon definition by its catalog ID. */
export function getAddonById(id: string): AddonDefinition | undefined {
  return ADDON_CATALOG.find((a) => a.id === id);
}

/** Calculate total addon price. */
export function calculateAddonTotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

/** Normalize the raw JSON stored in Booking.addons into a consistent array. */
export function normalizeAddons(raw: any): BookingAddonItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (item): item is BookingAddonItem =>
          item && typeof item === "object" && typeof item.name === "string"
      )
      .map((item) => ({
        ...item,
        // Back-compat: old items used pricePerPassenger, new use pricePerUnit
        pricePerUnit: item.pricePerUnit ?? (item as any).pricePerPassenger ?? 0,
      }));
  }
  // Legacy object format: { extraBaggage: {departure: true}, wimpyMeal1: {...}, ... }
  if (typeof raw === "object") {
    const legacyMap: Record<string, { name: string; price: number; category: string }> = {
      extraBaggage: { name: "Extra Baggage", price: 300, category: "luggage" },
      wimpyMeal1: { name: "Wimpy Meal for 1", price: 67, category: "meal" },
      wimpyMeal2: { name: "Wimpy Meal for 2", price: 137, category: "meal" },
      travelInsurance: { name: "Travel Insurance", price: 450, category: "service" },
    };
    const items: BookingAddonItem[] = [];
    Object.entries(raw).forEach(([key, selection]: [string, any]) => {
      const mapped = legacyMap[key];
      if (!mapped) return;
      let qty = 0;
      if (selection?.departure) qty++;
      if (selection?.return) qty++;
      if (qty === 0) qty = 1;
      items.push({
        catalogId: key,
        name: mapped.name,
        category: mapped.category,
        pricePerUnit: mapped.price,
        quantity: qty,
        totalPrice: mapped.price * qty,
        addedAt: new Date().toISOString(),
      });
    });
    return items;
  }
  return [];
}

/** Check if a booking has any meal addon (old or new format). */
export function hasMealAddon(raw: any): boolean {
  const addons = normalizeAddons(raw);
  if (
    addons.some(
      (a) => a.category === "meal" || a.name.toLowerCase().includes("wimpy")
    )
  ) {
    return true;
  }
  if (typeof raw === "string" && raw.toLowerCase().includes("wimpy"))
    return true;
  return false;
}
