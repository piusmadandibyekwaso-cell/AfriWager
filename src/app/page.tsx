'use client';
import Navbar from "@/components/Navbar";
import { ArrowRight, TrendingUp, Shield, Globe, Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { marketService, Market } from "@/services/marketService";
import Link from "next/link";

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const data = await marketService.getMarkets();
        setMarkets(data);
      } catch (error) {
        console.error("Failed to load markets", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-7xl pt-16 sm:pt-24 text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-emerald-400 backdrop-blur-xl mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              The Future of Prediction Markets in Africa
            </div>

            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-8">
              Predict the Future. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-500">
                Trade the Outcome.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-400 mb-10">
              AFRISIGHTS is the premier decentralized prediction market for Africa.
              Trade on news, politics, sports, and culture with transparent odds and instant payouts.
            </p>

            <div className="flex items-center justify-center gap-6">
              <button className="rounded-full bg-white px-8 py-4 text-base font-bold text-black hover:bg-zinc-200 transition-all hover:scale-105 flex items-center gap-2">
                Start Trading <ArrowRight className="h-5 w-5" />
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                View Markets
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-20 border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-1">$12M+</div>
                <div className="text-sm text-zinc-500">Total Volume</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">50K+</div>
                <div className="text-sm text-zinc-500">Active Traders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Instant</div>
                <div className="text-sm text-zinc-500">Payout Speed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Markets */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Trending Markets</h2>
            <a href="#" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <div key={market.id} className="flex flex-col bg-[#111111] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
                  <div className="h-48 w-full relative">
                    <img
                      src={market.image_url}
                      alt={market.question}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                      {market.category}
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <h3 className="text-xl font-semibold leading-7 text-white mb-2">
                      <Link href={`/markets/${market.id}`}>
                        <span className="absolute inset-0" />
                        {market.question}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                      {market.description}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>${market.total_volume_usdc.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Ends {new Date(market.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button className="bg-[#1A2C2C] hover:bg-[#1f3838] text-emerald-500 py-2 rounded-lg font-medium transition-colors border border-emerald-500/10">
                        Yes 50¢
                      </button>
                      <button className="bg-[#2C1A1A] hover:bg-[#381f1f] text-red-500 py-2 rounded-lg font-medium transition-colors border border-red-500/10">
                        No 50¢
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-6 py-24 border-t border-white/10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Real-Time Odds</h3>
              <p className="text-zinc-400">Prices reflect the collective wisdom of the crowd, updating instantly as new information emerges.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Secure & Transparent</h3>
              <p className="text-zinc-400">Built on blockchain technology ensuring all transactions are immutable and payouts are guaranteed.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Global Access</h3>
              <p className="text-zinc-400">Trade from anywhere in Africa. No barriers, just pure market action powered by crypto.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
