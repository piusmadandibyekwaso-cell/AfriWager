import Navbar from '@/components/Navbar';
import { Hammer, Code, Coins, Cpu } from 'lucide-react';

export default function BuildersPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-6">
                        <Hammer className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">AfriWager Builders</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                        Build the Future of African Prediction Markets
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Join an elite group of quantitative researchers, smart contract engineers, and market makers shaping the liquidity layer for African events.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all">
                        <Code className="w-8 h-8 text-emerald-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">API Access</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                            High-frequency endpoints for algorithmic trading, real-time probability streams, and historical orderbook data.
                        </p>
                        <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-emerald-400">Request Keys →</button>
                    </div>

                    <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-blue-500/30 transition-all">
                        <Coins className="w-8 h-8 text-blue-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">Market Making</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                            Provide liquidity to emerging markets and earn yield. Institutional-grade tooling for spread management.
                        </p>
                        <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:text-blue-400">Join Program →</button>
                    </div>

                    <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-purple-500/30 transition-all">
                        <Cpu className="w-8 h-8 text-purple-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">Oracle Node Operation</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                            Run decentralized infrastructure to resolve markets securely. Earn fees by providing ground-truth data.
                        </p>
                        <button className="text-[10px] font-black uppercase tracking-widest text-purple-500 group-hover:text-purple-400">Read Docs →</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
