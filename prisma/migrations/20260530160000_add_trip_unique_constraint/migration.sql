-- Create unique index to prevent duplicate trips
CREATE UNIQUE INDEX "Trip_routeOrigin_routeDestination_departureDate_departureTime_serviceType_key" ON "Trip"("routeOrigin", "routeDestination", "departureDate", "departureTime", "serviceType");
