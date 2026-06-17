const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the normalizeAddons function
function normalizeAddons(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(item => item && typeof item === "object" && typeof item.name === "string");
  }
  if (typeof raw === "object") {
    const legacyMap = {
      extraBaggage: { name: "Extra Baggage", price: 300, category: "luggage" },
      wimpyMeal1: { name: "Wimpy Meal for 1", price: 67, category: "meal" },
      wimpyMeal2: { name: "Wimpy Meal for 2", price: 137, category: "meal" },
      travelInsurance: { name: "Travel Insurance", price: 450, category: "service" },
    };
    const items = [];
    Object.entries(raw).forEach(([key, selection]) => {
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

async function debugAddonFormat() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { orderId: 'RT435442' }
    });

    if (!booking) {
      console.log('Booking not found');
      process.exit(1);
    }

    console.log('=== RAW ADDON DATA FROM DB ===');
    console.log(JSON.stringify(booking.addons, null, 2));
    console.log('');

    console.log('=== ADDON FORMAT DETECTION ===');
    console.log('Is Array?', Array.isArray(booking.addons));
    console.log('Is Object?', typeof booking.addons === 'object');
    console.log('');

    const normalized = normalizeAddons(booking.addons);
    console.log('=== NORMALIZED ADDONS ===');
    normalized.forEach((addon, i) => {
      console.log(`${i + 1}. ${addon.name}`);
      console.log(`   - Quantity: ${addon.quantity}`);
      console.log(`   - Price per unit: ${addon.pricePerUnit}`);
      console.log(`   - Total: ${addon.totalPrice} BWP`);
    });
    console.log('');

    const addonTotal = normalized.reduce((sum, a) => sum + a.totalPrice, 0);
    console.log(`TOTAL ADD-ONS (normalized): ${addonTotal} BWP`);
    console.log(`BOOKING TOTAL PRICE (from DB): ${booking.totalPrice} BWP`);
    console.log('');

    // Let me recalculate: if the normalized shows 204, but DB shows 3338
    // Then: 3338 - 3000 = 338 remaining
    // So the question is: where did the extra 134 come from?
    
    // Maybe the addon data is incomplete and was modified after initial creation
    // Let me check if buildAddonItems would have created different data
    
    console.log('=== WHAT SHOULD HAVE BEEN SENT ===');
    console.log('With buildAddonItems() for 3 departure + 3 return passengers:');
    console.log('- If wimpyMeal1 was added for departure:');
    console.log('  - Should calculate qty based on departureQty');
    console.log('  - Default qty for "departure" = departurePayingPassengers.length');
    console.log('  - So qty would be 3 (all departure passengers)');
    console.log('  - Total: 3 × 67 = 201 BWP');
    console.log('');
    console.log('- If wimpyMeal2 was added for departure:');
    console.log('  - Default qty for wimpyMeal2 = Math.floor(passengerCount / 2)');
    console.log('  - So qty would be floor(3/2) = 1');
    console.log('  - Total: 1 × 137 = 137 BWP');
    console.log('');
    console.log('- ORIGINAL ADDON TOTAL: 201 + 137 = 338 BWP');
    console.log('');
    console.log('CONCLUSION: The DB stored 338 BWP of addons, but the legacy');
    console.log('boolean format only shows 204 BWP when normalized!');
    console.log('');
    console.log('The issue: addons field is storing in LEGACY format without quantities!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAddonFormat();
