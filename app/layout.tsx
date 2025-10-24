import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recca Travel',
  description: 'Going Places',
  generator: 'toporapula.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
