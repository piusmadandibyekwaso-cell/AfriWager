import React from 'react';
import { Search, TrendingUp, SlidersHorizontal, ChevronRight } from 'lucide-react';

interface MarketsNavBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export default function MarketsNavBar({ searchQuery, setSearchQuery }: MarketsNavBarProps) {
    const categories = [
        "Politics", "Sports", "Crypto", "Finance", "Geopolitics", "Earnings", "Tech", "Culture", "World", "Economy", "Climate & Science"
    ];

    const tags = [
        "All", "Trump", "CFB Playoffs", "Venezuela", "Ukraine", "Minnesota Fraud", "Epstein", "Lighter", "Ukraine Peace Deal", "Fed"
    ];

    return (
        <div className="w-full bg-[#1C1C1E] border-b border-zinc-800 text-white sticky top-16 z-40">
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className="container mx-auto px-4 md:px-6">

                {/* Top Row: Categories */}
                <div className="relative group">
                    <div className="flex items-center h-12 gap-6 overflow-x-auto no-scrollbar text-sm font-semibold border-b border-zinc-800/50 pr-8">
                        <div className="flex items-center gap-6 flex-shrink-0 text-zinc-400">
                            <button className="flex items-center gap-1.5 text-white hover:text-emerald-400 transition-colors">
                                <TrendingUp className="w-4 h-4" />
                                <span>Trending</span>
                            </button>
                            <button className="hover:text-white transition-colors">Breaking</button>
                            <button className="hover:text-white transition-colors">New</button>
                        </div>

                        <div className="w-px h-4 bg-zinc-700 mx-2 flex-shrink-0" />

                        <div className="flex items-center gap-6 flex-shrink-0 text-zinc-400">
                            {categories.map(cat => (
                                <button key={cat} className="hover:text-white transition-colors whitespace-nowrap">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Right Fade & Arrow */}
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1C1C1E] to-transparent pointer-events-none flex items-center justify-end pr-1">
                        <ChevronRight className="w-4 h-4 text-zinc-500/70" />
                    </div>
                </div>

                {/* Bottom Row: Search & Tags */}
                <div className="relative group">
                    <div className="flex items-center h-14 gap-4 overflow-x-auto no-scrollbar py-2 pr-12">
                        {/* Search Input */}
                        <div className="relative flex-shrink-0 w-64 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search markets"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#2C2C2E] border border-transparent focus:border-emerald-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="w-px h-5 bg-zinc-700 mx-2 flex-shrink-0 hidden md:block" />

                        {/* Filter Icon */}
                        <button className="p-2 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-zinc-700 mx-2 flex-shrink-0 hidden md:block" />

                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-shrink-0 text-sm font-medium">
                            <button className="px-3 py-1.5 bg-[#2C2C2E] text-emerald-400 rounded-md whitespace-nowrap">
                                All
                            </button>
                            {tags.slice(1).map(tag => (
                                <button key={tag} className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-[#2C2C2E] rounded-md transition-colors whitespace-nowrap">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Right Fade & Arrow */}
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1C1C1E] to-transparent pointer-events-none flex items-center justify-end pr-1">
                        <ChevronRight className="w-5 h-5 text-zinc-500/70" />
                    </div>
                </div>

            </div>
        </div>
    );
}
