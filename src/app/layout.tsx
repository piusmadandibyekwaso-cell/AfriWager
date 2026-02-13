import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.afriwager.com'),
  title: "AfriWager - Africa's Largest Prediction Market | Trade on Real World Events",
  description: "AfriWager is Africa's premier prediction market where you can trade on the outcome of real-world events. Buy and sell Event Contracts on politics, economics, and culture.",
  keywords: ["Derivatives", "Market Pricing", "Event Contracts", "FinTech", "Prediction Market", "Africa", "Exchange"],
  manifest: "/manifest.json",
  themeColor: "#060709",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AfriWager",
  },
  openGraph: {
    title: "AfriWager - Africa's Largest Prediction Market",
    description: "AfriWager is Africa's premier prediction market where you can trade on the outcome of real-world events.",
    url: 'https://www.afriwager.com',
    siteName: 'AfriWager',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' } // Fallback
    ],
    apple: '/logo.svg', // SVGs work on modern iOS PWA but backup png is safer. We'll try SVG.
  },
};

import { Providers } from "./providers";
import MobileNavbar from "@/components/MobileNavbar";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-emerald-500/30`}
      >
        <Providers>
          <main className="pb-24 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNavbar />
        </Providers>
      </body>
    </html>
  );
}
