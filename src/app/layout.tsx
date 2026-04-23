import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
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
    description: "AfriWager is Africa's premier prediction market where you can trade on the outcome of real-world events. Buy and sell Event Contracts on politics, economics, and culture.",
    url: 'https://www.afriwager.com',
    siteName: 'AfriWager',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.afriwager.com/app_icon_512.png',
        width: 512,
        height: 512,
        alt: 'AfriWager - Africa\'s Largest Prediction Market',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "AfriWager - Africa's Largest Prediction Market",
    description: "Trade on the outcome of real-world African events. Politics, economics, sports, culture.",
    images: ['https://www.afriwager.com/app_icon_512.png'],
    site: '@AfriWager',
  },
  icons: {
    icon: [
      { url: '/logo_v3.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
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
        className={`${inter.variable} ${robotoMono.variable} antialiased selection:bg-emerald-500/30`}
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
