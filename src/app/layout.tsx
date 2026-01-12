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
  title: "AfriWager – The African Event Exchange | Peer-to-Peer Prediction Markets",
  description: "Africa’s premier marketplace for event-contingent contracts. Trade on economic, political, and cultural outcomes with market-driven pricing and transparent settlement.",
  keywords: ["Derivatives", "Market Pricing", "Event Contracts", "FinTech", "Prediction Market", "Africa", "Exchange"],
  manifest: "/manifest.json",
  themeColor: "#060709",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AfriWager",
  },
  openGraph: {
    title: "AfriWager – The African Event Exchange",
    description: "Africa’s premier marketplace for event-contingent contracts. Market-driven pricing and transparent settlement.",
    url: 'https://www.afriwager.com',
    siteName: 'AfriWager',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/app_icon_512.png',
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
