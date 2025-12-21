import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MarketCardProps {
    title: string;
    volume: string;
    chance: number;
    image?: string;
    category: string;
}

export default function MarketCard({ title, volume, chance, category }: MarketCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-4 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{category}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white leading-snug group-hover:text-emerald-400 transition-colors">
                        {title}
                    </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-zinc-800 flex-shrink-0" />
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500">Volume</span>
                    <span className="text-sm font-medium text-zinc-300">{volume}</span>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-medium">Yes</span>
                    </div>
                    <span className="text-xl font-bold text-white">{chance}%</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${chance}%` }}
                />
            </div>
        </div>
    );
}
