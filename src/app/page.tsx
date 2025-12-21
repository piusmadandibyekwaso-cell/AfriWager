import Navbar from "@/components/Navbar";
import MarketCard from "@/components/MarketCard";
import { ArrowRight, TrendingUp, Shield, Globe } from "lucide-react";

export default function Home() {
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

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-8">
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MarketCard
              title="Will Nigeria win the next AFCON?"
              category="Sports"
              volume="$1.2M"
              chance={65}
            />
            <MarketCard
              title="Bitcoin to hit $100k before 2025?"
              category="Crypto"
              volume="$4.5M"
              chance={32}
            />
            <MarketCard
              title="Ghana GDP growth > 5% in 2024?"
              category="Economics"
              volume="$890K"
              chance={45}
            />
            <MarketCard
              title="Music Award: Burna Boy to win Grammy?"
              category="Pop Culture"
              volume="$2.1M"
              chance={78}
            />
            <MarketCard
              title="Tech: Starlink expansion to 10 more countries?"
              category="Technology"
              volume="$650K"
              chance={92}
            />
            <MarketCard
              title="Election: Ruling party to retain seat?"
              category="Politics"
              volume="$3.4M"
              chance={50}
            />
          </div>
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
