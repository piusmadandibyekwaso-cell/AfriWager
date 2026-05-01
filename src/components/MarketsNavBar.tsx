'use client';

import React from 'react';
import { Search, TrendingUp, SlidersHorizontal, ChevronRight, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MarketsNavBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export default function MarketsNavBar({ searchQuery, setSearchQuery }: MarketsNavBarProps) {
    const categories = [
        "Politics", "Sports", "Crypto", "Finance", "Geopolitics", "Earnings", "Tech", "Culture", "World", "Economy", "Climate & Science"
    ];

    const tags = [
        "All", "Museveni", "Ruto", "AFCON", "Bitcoin", "Nigeria", "Inflation", "Kenya", "South Africa", "Ethereum"
    ];

    return (
        <div className="w-full bg-[#060709] border-b border-white/5 text-white sticky top-16 z-40 backdrop-blur-3xl">
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className="mx-auto max-w-7xl px-6">
                {/* Top Row: Categories */}
                <div className="relative">
                    <div className="flex items-center h-14 gap-8 overflow-x-auto no-scrollbar text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                        <div className="flex items-center gap-8 flex-shrink-0">
                            <button
                                onClick={() => setSearchQuery('')}
                                className={cn(
                                    "flex items-center gap-2 transition-all hover:text-white",
                                    searchQuery === '' ? "text-emerald-500" : "text-zinc-500"
                                )}
                            >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Trending</span>
                            </button>
                            <button className="text-zinc-500 hover:text-white transition-all">New</button>
                        </div>

                        <div className="w-px h-4 bg-white/10 flex-shrink-0" />

                        <div className="flex items-center gap-8 flex-shrink-0">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSearchQuery(cat)}
                                    className={cn(
                                        "transition-all whitespace-nowrap hover:text-white",
                                        searchQuery === cat ? "text-emerald-500" : "text-zinc-500"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Search & Tags */}
                <div className="flex items-center h-16 gap-6 overflow-x-auto no-scrollbar">
                    {/* Search Input */}
                    <div className="relative flex-shrink-0 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Explore markets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/[0.03] border border-white/5 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-[11px] font-semibold tracking-widest text-white placeholder:text-zinc-700 focus:outline-none transition-all w-64 md:w-80"
                        />
                    </div>

                    <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                    {/* Tags */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {tags.map(tag => {
                            const isActive = tag === "All" ? searchQuery === "" : searchQuery === tag;
                            return (
                                <button
                                    key={tag}
                                    onClick={() => setSearchQuery(tag === "All" ? "" : tag)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg whitespace-nowrap text-[9px] font-bold uppercase tracking-widest transition-all",
                                        isActive
                                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10"
                                            : "text-zinc-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
