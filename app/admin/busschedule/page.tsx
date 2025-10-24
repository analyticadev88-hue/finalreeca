import BusScheduleContent from "@/components/bus-schedule/BusScheduleContent";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ConsultantBusSchedulePage() {
  return (
    <ErrorBoundary>
      <BusScheduleContent basePath="/admin" />
    </ErrorBoundary>
  );
}

