'use client';
import { use } from "react";
import ManifestContent from "@/components/manifest/ManifestContent";

export default function ManifestPage({ params: paramsPromise, onBack }: { params: Promise<{ busId: string }>, onBack?: () => void }) {
  const params = use(paramsPromise);
  const busId = params.busId;
  return <ManifestContent busId={busId} onBack={onBack} allowWalkIn={true} />;
}
