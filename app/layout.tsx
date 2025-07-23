import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Toaster } from "sonner"
import NextTopLoader from "nextjs-toploader"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "FactoryAirWatch - Industrial Air Quality Monitoring",
  description:
    "Monitor and analyze air quality in industrial environments with real-time data, advanced analytics, and instant alerts.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'