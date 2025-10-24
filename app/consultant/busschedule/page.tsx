import BusScheduleContent from "@/components/bus-schedule/BusScheduleContent";

interface ConsultantBusSchedulePageProps {
  onViewManifest?: (busId: string) => void;
}

export default function ConsultantBusSchedulePage({ onViewManifest }: ConsultantBusSchedulePageProps) {
  return <BusScheduleContent basePath="/consultant" onViewManifest={onViewManifest} />;
}