// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import PaymentSuspension from '@/components/PaymentSuspension'

export const metadata: Metadata = {
  title: 'Recca Travel',
  description: 'Going Places',
  generator: 'toporapula.dev',
}

// Control this with environment variable
const isSuspended = process.env.NEXT_PUBLIC_SITE_SUSPENDED === 'false'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {isSuspended ? <PaymentSuspension /> : children}
      </body>
    </html>
  )
}