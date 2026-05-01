'use client';

import Navbar from '@/components/Navbar';
import { AlertTriangle, TrendingDown, ShieldAlert, BarChart3 } from 'lucide-react';

export default function RiskDisclosurePage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-8">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">High Risk Warning</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-8">
                        Risk Disclosure
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium">
                        Essential information for professional market participants.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-[#0c0e12] border border-white/5 p-10 rounded-[2rem]">
                        <div className="flex items-center gap-4 mb-8">
                            <TrendingDown className="w-6 h-6 text-red-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">1. Capital Loss Risk</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-6">
                            Trading in event contracts involves a high degree of risk. You should only trade with funds that you can afford to lose. Unlike traditional equity markets, event contracts often result in a binary outcome (0 or 100), meaning your entire position can become worthless upon market resolution.
                        </p>
                    </section>

                    <section className="bg-[#0c0e12] border border-white/5 p-10 rounded-[2rem]">
                        <div className="flex items-center gap-4 mb-8">
                            <ShieldAlert className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">2. Liquidity & Volatility</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-6">
                            Markets for specific event contracts may have limited liquidity. This can result in significant price slippage when entering or exiting large positions. Prices are highly volatile and can move rapidly based on breaking news, public sentiment, or social media trends.
                        </p>
                    </section>

                    <section className="bg-[#0c0e12] border border-white/5 p-10 rounded-[2rem]">
                        <div className="flex items-center gap-4 mb-8">
                            <BarChart3 className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">3. Oracle & Settlement Risk</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-6">
                            Resolution of contracts relies on the **Guardian Protocol**. While designed for maximum integrity, there is a risk of data source ambiguity, reporting delays, or external manipulation of the resolution source. All resolutions are final once processed by the decentralized network.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
