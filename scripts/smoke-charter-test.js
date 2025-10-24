const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const company = 'SMOKE_CORP_TEST';
  const dateStr = '2025-10-23';
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0,0,0,0);
  const nextDay = new Date(startOfDay);
  nextDay.setDate(nextDay.getDate() + 1);

  const origin = 'Gaborone';
  const dest = 'OR Tambo Airport';
  const time = '07:00';
  // For Morning Bus pairing also include the return leg
  const paired = [
    { origin, dest, time: '07:00' },
    { origin: dest, dest: origin, time: '17:00' }
  ];

  console.log('--- SMOKE TEST: charters (start) ---');

  // Inspect existing regular trips for both paired descriptors
  const originalTrips = await prisma.trip.findMany({
    where: {
      OR: paired.map(p => ({
        routeOrigin: p.origin,
        routeDestination: p.dest,
        departureDate: { gte: startOfDay, lt: nextDay },
        departureTime: { startsWith: p.time }
      }))
    },
    orderBy: { departureDate: 'asc' }
  });

  console.log('Found original trips matching paired descriptors:', originalTrips.length);
  if (originalTrips.length > 0) {
    console.log('Sample original trip fare/duration (first):', originalTrips[0].fare, originalTrips[0].durationMinutes);
  } else {
    console.log('No matching original trips found for the descriptors — test will still proceed but cannot learn fare/duration.');
  }

  // Create corporate charter trip
  const customFare = 1000;
  const totalSeats = 57;
  const charterTrip = await prisma.trip.create({ data: {
    serviceType: 'Corporate Charter',
    routeName: `${origin} → ${dest}`,
    routeOrigin: origin,
    routeDestination: dest,
    departureDate: new Date(dateStr),
    departureTime: '00:00',
    totalSeats,
    availableSeats: totalSeats,
    fare: customFare,
    durationMinutes: originalTrips[0]?.durationMinutes ?? 390,
    boardingPoint: originalTrips[0]?.boardingPoint ?? '',
    droppingPoint: originalTrips[0]?.droppingPoint ?? '',
    promoActive: false,
    isChartered: true,
    charterCompany: company,
    charterDates: `${dateStr} to ${dateStr}`
  }});

  console.log('Created charter trip id:', charterTrip.id);

  const reservation = await prisma.tripReservation.create({ data: {
    tripId: charterTrip.id,
    reservedClientName: company,
    reservedCompany: company,
    reservedSeatsCount: totalSeats,
  }, include: { trip: true } });

  console.log('Created tripReservation id:', reservation.id);

  // Create seat reservations for charter
  const seatCreates = [];
  for (let i = 1; i <= totalSeats; i++) seatCreates.push({ tripId: reservation.trip.id, seatNumber: String(i), reservedBy: `charter:${reservation.id}`, tripReservationId: reservation.id, expiresAt: new Date(Date.now() + 1000*60*60*24*30) });
  await prisma.seatReservation.createMany({ data: seatCreates });

  // Mark matching original trips as chartered for each paired descriptor and create replacement Private Tours
  const quantumCount = 1; const quantumSize = 30; const addSeats = quantumCount * quantumSize;
  const QUANTUM_FARE = 500; // force public fare
  const QUANTUM_DURATION = 390; // force 6h30m

  let totalMarked = 0;
  const createdReplacements = [];

  for (const p of paired) {
    const updated = await prisma.trip.updateMany({
      where: { routeOrigin: p.origin, routeDestination: p.dest, departureDate: { gte: startOfDay, lt: nextDay }, departureTime: { startsWith: p.time }, isChartered: false },
      data: { isChartered: true, charterCompany: company, charterDates: `${dateStr} to ${dateStr}` }
    });
    console.log(`Marked trips for ${p.origin} -> ${p.dest} ${p.time}:`, updated.count);
    totalMarked += updated.count;

    const replacement = await prisma.trip.create({ data: {
      serviceType: 'Private Tours',
      routeName: `${p.origin} → ${p.dest}`,
      routeOrigin: p.origin,
      routeDestination: p.dest,
      departureDate: new Date(dateStr),
      departureTime: p.time,
      totalSeats: addSeats,
      availableSeats: addSeats,
      fare: QUANTUM_FARE,
      durationMinutes: QUANTUM_DURATION,
      boardingPoint: '',
      droppingPoint: '',
      promoActive: false,
      isChartered: false,
      charterCompany: company,
      charterDates: `${dateStr} to ${dateStr}`
    }});
    console.log('Created replacement Private Tours id:', replacement.id, 'fare/duration:', replacement.fare, replacement.durationMinutes);
    createdReplacements.push(replacement);
  }

  console.log('Total marked trips count:', totalMarked);
  const replacements = await prisma.trip.findMany({ where: { serviceType: 'Private Tours', charterCompany: company, departureDate: { gte: startOfDay, lt: nextDay } } });
  console.log('Replacement trips count:', replacements.length);

  // Now cancel the charter via reservationId logic (simulate API behavior)
  console.log('Now cancelling charter reservation:', reservation.id);
  // Unmark original trips — only regular service trips, do not unmark Corporate Charter or Private Tours, and exclude the charter trip itself
  const unmarked = await prisma.trip.updateMany({
    where: {
      charterCompany: company,
      departureDate: { gte: startOfDay, lt: nextDay },
      isChartered: true,
      serviceType: { notIn: ['Corporate Charter', 'Private Tours'] },
      id: { not: charterTrip.id }
    },
    data: { isChartered: false, charterCompany: null, charterDates: null }
  });
  console.log('Unmarked trips count:', unmarked.count);
  // Delete replacements (Private Tours)
  const deleted = await prisma.trip.deleteMany({ where: { serviceType: 'Private Tours', charterCompany: company, departureDate: { gte: startOfDay, lt: nextDay } } });
  console.log('Deleted replacement trips count:', deleted.count);

  // Cleanup: delete the charter trip and reservation and seatReservations created for test
  await prisma.seatReservation.deleteMany({ where: { tripReservationId: reservation.id } });
  await prisma.reservationLink.deleteMany({ where: { tripReservationId: reservation.id } }).catch(() => {});
  await prisma.tripReservation.delete({ where: { id: reservation.id } });
  await prisma.trip.delete({ where: { id: charterTrip.id } });

  console.log('--- SMOKE TEST: charters (done) ---');
}

run().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
