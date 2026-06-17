const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAddonPrices() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { orderId: 'RT435442' },
      include: { 
        passengers: true,
        trip: true,
        returnTrip: true
      }
    });

    if (!booking) {
      console.log('Booking not found');
      process.exit(1);
    }

    console.log('=== ADDON ANALYSIS ===');
    console.log('Stored addons:', JSON.stringify(booking.addons, null, 2));
    console.log('');

    // Based on the displayed price: Wimpy Meal for 1 × P67.00, Wimpy Meal for 2 × P137.00
    // This suggests: wimpyMeal1 = 67 BWP each, wimpyMeal2 = 137 BWP each
    
    console.log('From UI display:');
    console.log('- Wimpy Meal 1: 1 × 67 = 67 BWP');
    console.log('- Wimpy Meal 2: 1 × 137 = 137 BWP');
    console.log('- Total add-ons: 204 BWP');
    console.log('');

    // Passengers count
    const depPassengers = booking.passengers.filter(p => !p.isReturn);
    const retPassengers = booking.passengers.filter(p => p.isReturn);
    console.log('Passenger breakdown:');
    console.log(`- Departure: ${depPassengers.length} passengers`);
    console.log(`- Return: ${retPassengers.length} passengers`);
    console.log('');

    // Calculate what could cause 338 BWP
    console.log('=== POSSIBLE CAUSES ===');
    console.log('1. If wimpyMeal1 was added for ALL 3 departure passengers:');
    console.log(`   3 × 67 = 201 BWP`);
    console.log('');
    
    console.log('2. If wimpyMeal2 was added for all 3 departure passengers:');
    console.log(`   3 × 137 = 411 BWP (too high)`);
    console.log('');

    console.log('3. If both meals were added for all 3 departure passengers:');
    console.log(`   3 × (67 + 137) = 3 × 204 = 612 BWP (way too high)`);
    console.log('');

    console.log('4. If wimpyMeal1 for 3 dep passengers + wimpyMeal2 for 2 dep passengers:');
    console.log(`   (3 × 67) + (2 × 137) = 201 + 274 = 475 BWP (too high)`);
    console.log('');

    console.log('5. If wimpyMeal1 for 3 dep passengers + wimpyMeal2 for 1 dep passenger:');
    console.log(`   (3 × 67) + (1 × 137) = 201 + 137 = 338 BWP ✓✓✓ MATCH!`);
    console.log('');

    console.log('=== CONCLUSION ===');
    console.log('The 338 BWP appears to be calculated as:');
    console.log('- wimpyMeal1 for 3 passengers (departure) = 3 × 67 = 201 BWP');
    console.log('- wimpyMeal2 for 1 passenger (departure) = 1 × 137 = 137 BWP');
    console.log('- TOTAL ADDON: 338 BWP');
    console.log('');
    console.log('BUT UI only shows: 67 + 137 = 204 BWP');
    console.log('');
    console.log('DISCREPANCY: 338 - 204 = 134 BWP (the extra charges not shown in UI!)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAddonPrices();
