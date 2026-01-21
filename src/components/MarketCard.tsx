import React from 'react';
import { Market } from '@/services/marketService';
import { MessageSquare, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

interface MarketCardProps {
    market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
    // Helper to get probability color
    const getProbColor = (prob: number) => {
        if (prob >= 0.7) return 'text-emerald-500 bg-emerald-500/10';
        if (prob <= 0.3) return 'text-red-500 bg-red-500/10';
        return 'text-zinc-300 bg-zinc-800';
    };

    // Sort outcomes (Yes/No usually)
    const outcomes = market.outcomes || [];
    const yesOutcome = outcomes.find(o => o.name === 'Yes');
    const noOutcome = outcomes.find(o => o.name === 'No');

    // Default probability if missing (e.g. 50/50)
    const yesProb = Math.round((yesOutcome?.current_probability || 0.5) * 100);
    const noProb = Math.round((noOutcome?.current_probability || 0.5) * 100);

    return (
        <Link href={`/markets/${market.id}`} className="group block h-full">
            <div className="flex flex-col h-full bg-[#1C1C1E] hover:bg-[#2C2C2E] transition-colors rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700">

                {/* Header: Icon + Question */}
                <div className="p-4 pb-2 flex gap-3">
                    {/* Compact Image/Icon (44x44) with Fallback */}
                    <div className="w-11 h-11 relative rounded-md overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                        <img
                            src={market.image_url}
                            alt={market.category}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to Category Icon
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none'; // Hide broken image
                                target.nextElementSibling?.classList.remove('hidden'); // Show fallback
                            }}
                        />
                        {/* Fallback Icon (Hidden by default, shown on error) */}
                        <div className="hidden absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {market.category.slice(0, 3)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[15px] font-medium text-white leading-snug line-clamp-2 md:line-clamp-3">
                            {market.question}
                        </h3>
                    </div>
                </div>

                {/* Body: Outcomes (Polymarket Style) */}
                <div className="px-4 py-2 flex-grow">
                    {/* Binary Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {/* Yes Button */}
                        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded transition-colors ${yesProb > noProb ? 'bg-emerald-500/10' : 'bg-zinc-800/50 group-hover:bg-zinc-700'} `}>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-0.5">Yes</span>
                            <span className={`text-lg font-bold ${yesProb > noProb ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                {yesProb}%
                            </span>
                        </div>

                        {/* No Button */}
                        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded transition-colors ${noProb > yesProb ? 'bg-red-500/10' : 'bg-zinc-800/50 group-hover:bg-zinc-700'}`}>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-0.5">No</span>
                            <span className={`text-lg font-bold ${noProb > yesProb ? 'text-red-500' : 'text-zinc-400'}`}>
                                {noProb}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer: Volume + Icons */}
                <div className="px-4 py-3 border-t border-zinc-800/50 flex items-center justify-between text-zinc-500">
                    <span className="text-xs font-medium">
                        ${market.total_volume_usdc?.toLocaleString() || '0'} Vol
                    </span>
                    <div className="flex items-center gap-3">
                        {/* Fake "Social" icons to match Polymarket vibe */}
                        <MessageSquare className="w-3.5 h-3.5 hover:text-white transition-colors" />
                        <RefreshCcw className="w-3.5 h-3.5 hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
