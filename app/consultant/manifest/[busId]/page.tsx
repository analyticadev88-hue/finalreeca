"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import ManifestContent from "@/components/manifest/ManifestContent";

export default function ConsultantManifestPage({ params: paramsPromise }: { params: Promise<{ busId: string }> }) {
  const params = use(paramsPromise);
  const busId = params.busId;
  const router = useRouter();
  return <ManifestContent busId={busId} onBack={() => router.push("/consultant/busschedule")} allowWalkIn={false} />;
}
