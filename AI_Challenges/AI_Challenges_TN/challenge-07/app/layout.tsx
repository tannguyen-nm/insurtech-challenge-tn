import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Claims Intake Wizard',
  description: 'Submit your insurance claim in 5 easy steps',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  )
}
