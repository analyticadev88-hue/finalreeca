/**
 * Addon Catalog — single source of truth for bookable add-ons.
 * Update prices here and they reflect across the entire system.
 */

export interface AddonDefinition {
  id: string;
  name: string;
  category: "meal" | "service" | "luggage";
  pricePerPassenger: number; // BWP
  description?: string;
}

export interface BookingAddonItem {
  catalogId: string;
  name: string;
  category?: string;
  pricePerPassenger: number;
  quantity: number;        // how many passengers
  totalPrice: number;      // pricePerPassenger * quantity
  addedAt: string;         // ISO string
  addedBy?: string;
}

/** Available addons that admin can attach to any booking. */
export const ADDON_CATALOG: AddonDefinition[] = [
  {
    id: "wimpy-breakfast",
    name: "Wimpy Breakfast",
    category: "meal",
    pricePerPassenger: 85,
    description: "Breakfast combo at Wimpy",
  },
  {
    id: "wimpy-lunch",
    name: "Wimpy Lunch",
    category: "meal",
    pricePerPassenger: 95,
    description: "Lunch combo at Wimpy",
  },
  {
    id: "wimpy-dinner",
    name: "Wimpy Dinner",
    category: "meal",
    pricePerPassenger: 110,
    description: "Dinner combo at Wimpy",
  },
  {
    id: "extra-luggage-20kg",
    name: "Extra Luggage (20kg)",
    category: "luggage",
    pricePerPassenger: 150,
    description: "Additional 20kg luggage allowance",
  },
  {
    id: "priority-boarding",
    name: "Priority Boarding",
    category: "service",
    pricePerPassenger: 50,
    description: "Board first with priority access",
  },
];

/** Get an addon definition by its catalog ID. */
export function getAddonById(id: string): AddonDefinition | undefined {
  return ADDON_CATALOG.find((a) => a.id === id);
}

/** Calculate total addon price. */
export function calculateAddonTotal(
  pricePerPassenger: number,
  quantity: number
): number {
  return Math.round(pricePerPassenger * quantity * 100) / 100;
}

/** Normalize the raw JSON stored in Booking.addons into a consistent array. */
export function normalizeAddons(raw: any): BookingAddonItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is BookingAddonItem =>
        item && typeof item === "object" && typeof item.name === "string"
    );
  }
  // Legacy object format: { wimpyMeal1: { departure: true }, ... }
  if (typeof raw === "object") {
    const legacyMap: Record<string, string> = {
      wimpyMeal1: "Wimpy Meal for 1",
      wimpyMeal2: "Wimpy Meal for 2",
    };
    const items: BookingAddonItem[] = [];
    Object.entries(raw).forEach(([key, selection]: [string, any]) => {
      const name = legacyMap[key] || key;
      let qty = 0;
      if (selection?.departure) qty++;
      if (selection?.return) qty++;
      if (qty === 0) qty = 1;
      const price = key === "wimpyMeal1" ? 67 : key === "wimpyMeal2" ? 137 : 0;
      items.push({
        catalogId: key,
        name,
        category: "meal",
        pricePerPassenger: price,
        quantity: qty,
        totalPrice: price * qty,
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
  if (addons.some((a) => a.category === "meal" || a.name.toLowerCase().includes("wimpy"))) {
    return true;
  }
  // Fallback for raw string check
  if (typeof raw === "string" && raw.toLowerCase().includes("wimpy")) return true;
  return false;
}
