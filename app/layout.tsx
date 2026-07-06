// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import PaymentSuspension from '@/components/PaymentSuspension'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Reeca Travel',
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        {isSuspended ? <PaymentSuspension /> : children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
