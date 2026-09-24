/**
 * Link corridor trips to their seat-source parent (backfill)
 *
 * The Gaborone ↔ Maun corridor runs ONE physical bus per date + direction.
 * Every trip row for that bus must share one seat inventory via parentTripId,
 * otherwise @@unique([tripId, seatNumber]) lets two clients book the same seat.
 *
 * This script:
 *   1. Groups corridor trips by (departure date, direction)
 *   2. Designates the full-route trip (Gaborone → Maun / Maun → Gaborone) as parent
 *   3. Sets parentTripId on all other trips in the group (idempotent)
 *   4. Reports duplicate-seat conflicts across trips of the same bus
 *
 * Usage:
 *   node scripts/link-corridor-trips.js          # dry-run (reports only)
 *   node scripts/link-corridor-trips.js --apply  # writes parentTripId links
 */

const path = require('path');
const fs = require('fs');

// Load .env (same pattern as scripts/backup-db.js)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

const NORTH_STOPS = ['Gaborone','Kumakwane','Thamaga','Moshupa','Kanye','Jwaneng','Kang','Ghanzi',"D'Kar",'Sandfire','Sehithwa','Toteng','Maun'];
const SOUTH_STOPS = ['Maun','Toteng','Sehithwa','Sandfire',"D'Kar",'Ghanzi','Kang','Jwaneng','Kanye','Moshupa','Thamaga','Kumakwane','Gaborone'];

function dayKey(d) {
  return new Date(d).toISOString().split('T')[0];
}

async function main() {
  // Fetch all trips and filter in JS — corridor stop names vary in casing in the DB
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      routeOrigin: true,
      routeDestination: true,
      departureDate: true,
      departureTime: true,
      parentTripId: true,
      serviceType: true,
    },
  });

  const canon = (s) => (s || '').trim().toLowerCase();
  const NORTH = NORTH_STOPS.map(canon);
  const SOUTH = SOUTH_STOPS.map(canon);

  function directionFor(originRaw, destRaw) {
    const origin = canon(originRaw);
    const destination = canon(destRaw);
    // Most corridor stops appear on BOTH lists, so membership alone is
    // ambiguous — direction is determined by stop ORDER.
    const nO = NORTH.indexOf(origin);
    const nD = NORTH.indexOf(destination);
    const sO = SOUTH.indexOf(origin);
    const sD = SOUTH.indexOf(destination);
    if (nO !== -1 && nD !== -1 && nO < nD) return 'north';
    if (sO !== -1 && sD !== -1 && sO < sD) return 'south';
    return null;
  }

  // Group by (day, direction). Trips with a stop off the corridor are skipped.
  const groups = new Map();
  for (const t of trips) {
    const dir = directionFor(t.routeOrigin, t.routeDestination);
    if (!dir) continue;
    const key = `${dayKey(t.departureDate)}|${dir}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }

  let linked = 0;
  let alreadyLinked = 0;
  let missingParent = 0;
  let conflicts = 0;
  let serviceTypeFixed = 0;

  // Corridor trips are all one night run per direction — fix any that were
  // stored with a time-derived label (e.g. "Morning Bus" for 00:00 departures)
  for (const t of trips) {
    if (directionFor(t.routeOrigin, t.routeDestination) && t.serviceType !== 'Night Bus') {
      console.log(`[SERVICE TYPE] ${dayKey(t.departureDate)} ${t.routeOrigin} → ${t.routeDestination}: "${t.serviceType}" → "Night Bus"`);
      if (APPLY) {
        await prisma.trip.update({ where: { id: t.id }, data: { serviceType: 'Night Bus' } });
      }
      serviceTypeFixed++;
    }
  }

  for (const [key, group] of [...groups.entries()].sort()) {
    const parentOrigin = key.endsWith('|north') ? 'Gaborone' : 'Maun';
    const parentDest = key.endsWith('|north') ? 'Maun' : 'Gaborone';

    const parents = group.filter(
      t => canon(t.routeOrigin) === canon(parentOrigin) && canon(t.routeDestination) === canon(parentDest)
    );
    const children = group.filter(t => !parents.includes(t));

    if (parents.length === 0) {
      missingParent++;
      console.log(`[MISSING PARENT] ${key}: ${children.length} unlinked trip(s), no ${parentOrigin} → ${parentDest} trip found`);
      continue;
    }
    if (parents.length > 1) {
      console.log(`[WARN] ${key}: ${parents.length} full-route trips (using ${parents[0].id}); consider deduplicating`);
    }
    const parent = parents[0];

    for (const child of children) {
      if (child.parentTripId === parent.id) {
        alreadyLinked++;
        continue;
      }
      if (child.parentTripId && child.parentTripId !== parent.id) {
        console.log(`[RELINK] ${key}: ${child.routeOrigin} → ${child.routeDestination} ${child.id}: parentTripId ${child.parentTripId} → ${parent.id}`);
      } else {
        console.log(`[LINK]   ${key}: ${child.routeOrigin} → ${child.routeDestination} ${child.id} → parent ${parent.id}`);
      }
      if (APPLY) {
        await prisma.trip.update({ where: { id: child.id }, data: { parentTripId: parent.id } });
      }
      linked++;
    }
  }

  // Conflict report: same seatNumber sold on multiple trips of the same bus group
  console.log('\n--- Duplicate-seat conflicts per bus (sold seats, excluding cancelled/failed) ---');
  for (const [key, group] of [...groups.entries()].sort()) {
    const tripIds = group.map(t => t.id);
    const passengers = await prisma.passenger.findMany({
      where: {
        tripId: { in: tripIds },
        booking: {
          bookingStatus: { notIn: ['cancelled', 'nullified'] },
          paymentStatus: { notIn: ['cancelled', 'failed', 'refunded'] },
        },
      },
      select: { seatNumber: true, tripId: true, booking: { select: { orderId: true } } },
    });
    const bySeat = new Map();
    for (const p of passengers) {
      if (!bySeat.has(p.seatNumber)) bySeat.set(p.seatNumber, []);
      bySeat.get(p.seatNumber).push(p);
    }
    for (const [seat, list] of bySeat) {
      if (list.length > 1) {
        conflicts++;
        const who = list
          .map(p => {
            const t = group.find(g => g.id === p.tripId);
            return `${p.booking.orderId} (${t.routeOrigin} → ${t.routeDestination})`;
          })
          .join(' | ');
        console.log(`[CONFLICT] ${key} seat ${seat}: ${who}`);
      }
    }
  }
  if (conflicts === 0) console.log('None.');

  console.log(`\nSummary: ${groups.size} bus-day groups | ${linked} trips to link (${alreadyLinked} already linked, ${missingParent} missing parent) | ${serviceTypeFixed} serviceType labels to fix | ${conflicts} seat conflicts`);
  if (!APPLY && (linked > 0 || serviceTypeFixed > 0)) console.log('\nDRY-RUN — re-run with --apply to write the changes.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
