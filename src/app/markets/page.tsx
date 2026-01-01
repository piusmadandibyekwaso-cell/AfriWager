'use client';

import { useState, useEffect } from 'react';
import MarketCard from '@/components/MarketCard';
import Navbar from '@/components/Navbar';
import MarketsNavBar from '@/components/MarketsNavBar';
import { marketService, Market } from '@/services/marketService';

export default function MarketsPage() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchMarkets() {
            try {
                const data = await marketService.getMarkets();
                setMarkets(data); // Filtering handled in service now? Or verified there.
            } catch (error) {
                console.error("Failed to load markets", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMarkets();
    }, []);

    const filteredMarkets = markets.filter(market =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <Navbar />

            {/* Header / Sub-Nav */}
            <div className="pt-20"> {/* Offset for main navbar */}
                <MarketsNavBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            <main className="py-8 container mx-auto px-4 md:px-6">
                {/* Removed Old Header */}

                {loading ? (
                    <div className="flex justify-center py-40">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    // Polymarket Grid Layout (4 columns on huge screens, 3 on lg, 2 on md)
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
                )}
            </main>
        </div>
    );
}
