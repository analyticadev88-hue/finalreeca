const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBooking() {
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

    console.log('=== BOOKING DETAILS ===');
    console.log('Order ID:', booking.orderId);
    console.log('Total Price (stored):', booking.totalPrice);
    console.log('Discount Amount (stored):', booking.discountAmount);
    console.log('Addons (raw JSON):', JSON.stringify(booking.addons, null, 2));
    console.log('Seat Count:', booking.seatCount);
    console.log('Payment Status:', booking.paymentStatus);
    console.log('');
    
    console.log('=== PASSENGERS ===');
    console.log('Total passengers:', booking.passengers.length);
    booking.passengers.forEach((p, i) => {
      console.log(`${i + 1}. ${p.firstName} ${p.lastName} - Seat ${p.seatNumber} (${p.isReturn ? 'return' : 'departure'}) - Type: ${p.type}`);
    });
    console.log('');

    console.log('=== TRIP INFO ===');
    console.log('Departure Trip:', booking.trip?.id, `-`, booking.trip?.routeOrigin, 'to', booking.trip?.routeDestination, `(Fare: ${booking.trip?.fare})`);
    if (booking.returnTrip) {
      console.log('Return Trip:', booking.returnTrip?.id, `-`, booking.returnTrip?.routeOrigin, 'to', booking.returnTrip?.routeDestination, `(Fare: ${booking.returnTrip?.fare})`);
    }
    console.log('');

    console.log('=== CALCULATION VERIFICATION ===');
    const depSeats = booking.seats ? booking.seats.split(',').filter(Boolean) : [];
    const retSeats = booking.returnSeats ? booking.returnSeats.split(',').filter(Boolean) : [];
    console.log('Departure seats:', depSeats.length, ':', depSeats.join(', '));
    console.log('Return seats:', retSeats.length, ':', retSeats.join(', '));
    
    const depPrice = depSeats.length * (booking.trip?.fare || 500);
    const retPrice = retSeats.length * (booking.returnTrip?.fare || 500);
    console.log('Departure subtotal:', depPrice, `(${depSeats.length} × ${booking.trip?.fare || 500})`);
    console.log('Return subtotal:', retPrice, `(${retSeats.length} × ${booking.returnTrip?.fare || 500})`);
    console.log('Discount:', booking.discountAmount);
    
    let addonsTotal = 0;
    if (booking.addons && typeof booking.addons === 'object') {
      if (Array.isArray(booking.addons)) {
        addonsTotal = booking.addons.reduce((sum, addon) => sum + (Number(addon.totalPrice) || 0), 0);
      }
    }
    console.log('Addons total:', addonsTotal);
    console.log('');
    console.log('Expected total:', depPrice + retPrice + addonsTotal - booking.discountAmount);
    console.log('Actual total:', booking.totalPrice);
    console.log('DIFFERENCE:', booking.totalPrice - (depPrice + retPrice + addonsTotal - booking.discountAmount));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugBooking();
