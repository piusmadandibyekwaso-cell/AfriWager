'use client';

import React from 'react';
import { Market } from '@/services/marketService';
import { MessageSquare, RefreshCcw, Landmark, Activity } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMarketImage } from '@/utils/marketImageGenerator';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MarketCardProps {
    market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
    // Sort outcomes (Yes/No usually)
    const outcomes = market.outcomes || [];
    const yesOutcome = outcomes.find(o => o.name === 'Yes');
    const noOutcome = outcomes.find(o => o.name === 'No');

    // Default probability if missing (e.g. 50/50)
    const yesProb = Math.round((yesOutcome?.current_probability || 0.5) * 100);
    const noProb = Math.round((noOutcome?.current_probability || 0.5) * 100);

    // Smart Image Resolution
    const displayImage = getMarketImage(market.question, market.category, market.image_url);

    return (
        <Link href={`/markets/${market.id}`} className="group block h-full">
            <div className="flex flex-col h-full bg-[#0c0e12]/80 hover:bg-[#0c0e12] transition-all duration-300 rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-emerald-500/30 shadow-2xl">
                
                {/* Header: Status Tag */}
                <div className="px-4 pt-4 flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md">Active</span>
                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">{market.category}</span>
                </div>

                {/* Main Content */}
                <div className="p-5 flex gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-inner">
                            <img
                                src={displayImage}
                                alt={market.category}
                                loading="eager"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white leading-tight uppercase italic tracking-tight line-clamp-3 group-hover:text-emerald-400 transition-colors">
                            {market.question}
                        </h3>
                    </div>
                </div>

                {/* Probability Display (Polymarket Clinical Style) */}
                <div className="px-5 pb-5 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                        <div className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-xl border transition-all relative overflow-hidden group/btn",
                            "bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)] hover:from-emerald-500/30 hover:to-emerald-900/50"
                        )}>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <span className="relative text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-1 z-10">Yes</span>
                            <span className="relative text-2xl font-black tracking-tighter tabular-nums text-emerald-400 z-10">
                                {yesProb}%
                            </span>
                        </div>
                        <div className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-xl border transition-all relative overflow-hidden group/btn",
                            "bg-gradient-to-b from-rose-500/20 to-rose-900/40 border-rose-500/30 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.2)] hover:from-rose-500/30 hover:to-rose-900/50"
                        )}>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <span className="relative text-[9px] font-black uppercase tracking-[0.2em] text-rose-400/80 mb-1 z-10">No</span>
                            <span className="relative text-2xl font-black tracking-tighter tabular-nums text-rose-400 z-10">
                                {noProb}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                            ${market.total_volume_usdc?.toLocaleString() || '0'} Vol
                        </span>
                    </div>
                    <div className="flex items-center gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                        <MessageSquare className="w-3 h-3 text-zinc-600 hover:text-white transition-colors" />
                        <Landmark className="w-3 h-3 text-zinc-600 hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
