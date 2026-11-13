import type { Metadata } from "next"
import { Cal_Sans, Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const calSans = Cal_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cal",
  // next/font has no metrics for Cal Sans, so it cannot build an adjusted fallback.
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
})

export const metadata: Metadata = {
  title: "NutriBook · Find a nutritionist",
  description: "Search nutritionists by name, service, and location, and request an appointment.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${calSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
