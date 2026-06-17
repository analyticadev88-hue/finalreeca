/**
 * AUDIT SCRIPT: Find bookings with addon data integrity issues
 * 
 * Issue: Some bookings were stored with legacy addon format that loses quantity information.
 * This caused discrepancies where customers were charged for addons but the displayed
 * total showed a different amount.
 * 
 * For booking RT435442:
 * - Charged: 3,338 BWP (includes 338 BWP for addons)
 * - Displayed: 3,204 BWP (only 204 BWP for addons shown)
 * - Discrepancy: 134 BWP overcharge (2 extra wimpyMeal1 charges not shown)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAddonIssues() {
  try {
    console.log('=== ADDON DATA INTEGRITY AUDIT ===\n');

    // Find all bookings with addons
    const bookingsWithAddons = await prisma.booking.findMany({
      where: {
        addons: { not: null }
      },
      select: {
        id: true,
        orderId: true,
        totalPrice: true,
        addons: true,
        seatCount: true,
        passengers: {
          select: {
            isReturn: true,
            firstName: true,
            lastName: true,
            seatNumber: true
          }
        }
      }
    });

    console.log(`Found ${bookingsWithAddons.length} bookings with addons\n`);

    const legacyFormatBookings = [];

    bookingsWithAddons.forEach(booking => {
      // Check if addon data is in legacy format (object with boolean values)
      const isLegacyFormat = 
        booking.addons && 
        typeof booking.addons === 'object' && 
        !Array.isArray(booking.addons) &&
        Object.values(booking.addons).some(val => 
          typeof val === 'object' && 
          ('departure' in val || 'return' in val)
        );

      if (isLegacyFormat) {
        // Calculate what the legacy format shows
        let legacyDisplayTotal = 0;
        const legacyMap = {
          extraBaggage: 300,
          wimpyMeal1: 67,
          wimpyMeal2: 137,
          travelInsurance: 450,
        };

        Object.entries(booking.addons).forEach(([key, selection]) => {
          const price = legacyMap[key];
          if (price && (selection.departure || selection.return)) {
            legacyDisplayTotal += price;
          }
        });

        // Get passenger count breakdown
        const depPassengers = booking.passengers.filter(p => !p.isReturn).length;
        const retPassengers = booking.passengers.filter(p => p.isReturn).length;

        legacyFormatBookings.push({
          orderId: booking.orderId,
          bookingId: booking.id,
          totalPrice: booking.totalPrice,
          legacyDisplayTotal,
          discrepancy: booking.totalPrice - legacyDisplayTotal,
          addonData: booking.addons,
          passengerBreakdown: `${depPassengers} dep + ${retPassengers} ret`
        });
      }
    });

    if (legacyFormatBookings.length === 0) {
      console.log('✅ No bookings found with legacy addon format issues');
      return;
    }

    console.log(`⚠️  Found ${legacyFormatBookings.length} bookings with potential addon display issues:\n`);

    legacyFormatBookings.forEach((booking, idx) => {
      console.log(`${idx + 1}. Order: ${booking.orderId}`);
      console.log(`   Charged: ${booking.totalPrice} BWP`);
      console.log(`   Display: ~${booking.legacyDisplayTotal} BWP (estimated)`);
      console.log(`   Discrepancy: ${booking.discrepancy} BWP`);
      console.log(`   Passengers: ${booking.passengerBreakdown}`);
      console.log(`   Addon Data: ${JSON.stringify(booking.addonData)}`);
      console.log('');
    });

    console.log(`\n=== SUMMARY ===`);
    const totalDiscrepancy = legacyFormatBookings.reduce((sum, b) => sum + b.discrepancy, 0);
    console.log(`Total affected bookings: ${legacyFormatBookings.length}`);
    console.log(`Total discrepancy (potential overcharges): ${totalDiscrepancy} BWP`);
    console.log(`\nRECOMMENDATION: Review these bookings and consider refunding customers`);
    console.log(`for display discrepancies. Generate reports for customer service.`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditAddonIssues();
