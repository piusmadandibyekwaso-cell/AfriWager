'use client';

import { useState } from 'react';
import MarketCard from '@/components/MarketCard';
import MarketsNavBar from '@/components/MarketsNavBar';
import { Market } from '@/services/marketService';

interface MarketsGridProps {
    initialMarkets: Market[];
}

export default function MarketsGrid({ initialMarkets }: MarketsGridProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMarkets = initialMarkets.filter(market =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Header / Sub-Nav */}
            <div className="pt-20"> {/* Offset for main navbar */}
                <MarketsNavBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            <main className="py-8 container mx-auto px-4 md:px-6">
                {/* Polymarket Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMarkets.length > 0 ? (
                        filteredMarkets.map((market) => (
                            <MarketCard key={market.id} market={market} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-zinc-500 text-sm font-medium">No markets found matching your search.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
