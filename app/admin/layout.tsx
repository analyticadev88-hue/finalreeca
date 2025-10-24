import type { Metadata } from "next";
import Layout from "@/components/Layout";
import ProtectedRouteLayout from "@/components/ProtectedRouteLayout";

export const metadata: Metadata = {
  title: "Reeca Travel Admin",
  description: "Admin dashboard for Reeca Travel bus booking system",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRouteLayout>{children}</ProtectedRouteLayout>;
}
