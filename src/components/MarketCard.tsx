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
            <div className="flex flex-col h-full bg-[#0c0e12] hover:bg-[#12141a] transition-all duration-200 rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 shadow-lg">
                
                {/* Header: Category & Gauge */}
                <div className="px-4 pt-4 flex justify-between items-start">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{market.category}</span>
                    
                    {/* Chance Gauge (Polymarket Meter) */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-zinc-800"
                            />
                            <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={100}
                                strokeDashoffset={100 - yesProb}
                                className="text-emerald-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[9px] font-bold text-white">{yesProb}%</span>
                        <span className="absolute -bottom-4 text-[7px] text-zinc-600 font-semibold uppercase tracking-tighter">Chance</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 py-3 flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                            <img
                                src={displayImage}
                                alt={market.category}
                                loading="eager"
                                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[13px] font-semibold text-zinc-100 leading-tight line-clamp-2 mb-2">
                            {market.question}
                        </h3>
                    </div>
                </div>

                {/* Probability Buttons (Polymarket Style) */}
                <div className="px-4 pb-4 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                            <span className="text-[10px] font-bold text-emerald-500">Yes</span>
                            <span className="text-[12px] font-semibold text-emerald-400 tabular-nums">{yesProb}%</span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors">
                            <span className="text-[10px] font-bold text-rose-500">No</span>
                            <span className="text-[12px] font-semibold text-rose-400 tabular-nums">{noProb}%</span>
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-600">
                        <Activity className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-tight">
                            ${market.total_volume_usdc?.toLocaleString() || '0'} Vol
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-700">
                        <MessageSquare className="w-3 h-3 hover:text-zinc-400 transition-colors" />
                        <Landmark className="w-3 h-3 hover:text-zinc-400 transition-colors" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
