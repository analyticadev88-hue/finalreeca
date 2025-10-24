"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const AdminManifestPage = dynamic(() => import("@/app/admin/manifest/[busId]/page"), { ssr: false });

export default function ConsultantManifestPage(props: any) {
  const router = useRouter();
  // reuse admin manifest page but override Back button to stay in consultant area
  return <AdminManifestPage {...props} onBack={() => router.push("/consultant/busschedule")} />;
}
