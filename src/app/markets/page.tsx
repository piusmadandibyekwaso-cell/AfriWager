'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import Link from 'next/link';
import { ArrowRight, Search, Filter } from 'lucide-react';

export default function MarketsPage() {
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

            <main className="pt-32 pb-24 container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
                            All Markets
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-2xl">
                            Explore, predict, and trade on the outcomes of future events.
                        </p>
                    </div>

                    {/* Search & Filter Bar (Visual Only for Audit) */}
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search markets..."
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors w-full md:w-64"
                            />
                        </div>
                        <button className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {markets.map((market) => (
                            <Link href={`/markets/${market.id}`} key={market.id} className="group block">
                                <div className="flex flex-col bg-[#111111] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1 h-full shadow-lg hover:shadow-emerald-900/10">
                                    <div className="h-48 w-full relative">
                                        <img
                                            src={market.image_url}
                                            alt={market.question}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent opacity-80" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                {market.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                                            {market.question}
                                        </h3>
                                        <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-800/50">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Volume</div>
                                                <div className="text-sm font-bold text-white">${market.total_volume_usdc.toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs font-bold text-emerald-500">Live</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
