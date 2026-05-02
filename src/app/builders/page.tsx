'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Hammer, Code, Coins, Cpu, Activity, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function BuildersPage() {
    const { user: authUser } = useAuth();
    const [markets, setMarkets] = useState<any[]>([]);
    const [selectedMarketId, setSelectedMarketId] = useState('');
    const [amount, setAmount] = useState('1000');
    const [isInjecting, setIsInjecting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');

    useEffect(() => {
        const fetchMarkets = async () => {
            const { data } = await supabase.from('markets').select('id, question').eq('status', 'OPEN');
            setMarkets(data || []);
        };
        fetchMarkets();
    }, []);

    const handleInjectLiquidity = async () => {
        if (!selectedMarketId || !amount || !authUser) return;
        setIsInjecting(true);
        setStatus('idle');

        try {
            // Institutional Protocol: Liquidity Injection via internal RPC
            const { error } = await supabase.rpc('inject_liquidity', {
                p_market_id: selectedMarketId,
                p_amount_usdc: parseFloat(amount)
            });

            if (error) throw error;
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('failed');
        } finally {
            setIsInjecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
                
                {/* Header */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-6">
                        <Hammer className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Institutional Terminal</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
                        Builder Ecosystem
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium max-w-2xl">
                        Advanced tooling for market makers, quantitative analysts, and protocol liquidity providers.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LIQUIDITY TERMINAL (The "Live Phase" Tool) */}
                    <div className="lg:col-span-7">
                        <div className="bg-[#0c0e12] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-32 h-32 text-emerald-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Coins className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase">Liquidity Injection</h2>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Capital Allocation Layer</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Select Market Target</label>
                                        <select 
                                            value={selectedMarketId}
                                            onChange={(e) => setSelectedMarketId(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                        >
                                            <option value="">Choose a market...</option>
                                            {markets.map(m => (
                                                <option key={m.id} value={m.id}>{m.question}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Capital Amount (USDC)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-700">$</span>
                                            <input 
                                                type="number" 
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-black border border-white/5 rounded-2xl py-6 pl-12 pr-6 text-2xl font-black text-white focus:outline-none focus:border-emerald-500/50"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleInjectLiquidity}
                                        disabled={isInjecting || !selectedMarketId || !amount}
                                        className="w-full py-6 bg-white hover:bg-emerald-500 text-black font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20"
                                    >
                                        {isInjecting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Allocating...</span>
                                            </>
                                        ) : status === 'success' ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>Injection Successful</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Initialize Liquidity</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDECAR INFO */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-[2.5rem] hover:border-emerald-500/20 transition-all">
                            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-6" />
                            <h3 className="text-xl font-black mb-3">Guardian Verification</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Every injection is verified by the Guardian Protocol. Allocated capital is split equally between YES and NO pools to maintain a 50/50 starting probability.
                            </p>
                        </div>

                        <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/20 transition-all">
                            <Cpu className="w-8 h-8 text-blue-500 mb-6" />
                            <h3 className="text-xl font-black mb-3">Automated MM</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Once injected, the AfriWager Automated Market Maker (AMM) manages spreads and ensures instant trade execution for users.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
