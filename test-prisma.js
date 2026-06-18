const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.trip.create({
      data: {
        routeOrigin: 'Maun',
        routeDestination: 'Gaborone',
        routeName: 'Maun to Gaborone',
        departureDate: new Date().toISOString(),
        departureTime: '05:30',
        totalSeats: 60,
        availableSeats: 60,
        serviceType: 'Morning Bus',
        fare: 300,
        durationMinutes: 400,
        promoActive: false,
        hasDeparted: false,
        boardingPoint: 'Maun Station',
        droppingPoint: 'Gaborone Station'
      }
    });
    console.log('Success');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
