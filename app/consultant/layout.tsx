// app/consultant/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultant Portal - Reeca Travel",
  description: "Consultant portal for Reeca Travel bus booking system",
};

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}