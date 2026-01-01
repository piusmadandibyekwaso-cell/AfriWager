import MarketCard from '@/components/MarketCard';

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

            <main className="pt-32 pb-24 container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">
                            Markets
                        </h1>

                        {/* Categories (Fake nav for visual) */}
                        <div className="flex gap-4 text-sm font-medium text-zinc-400 overflow-x-auto pb-2 scrollbar-hide">
                            <button className="text-white border-b-2 border-white pb-1">All</button>
                            <button className="hover:text-white transition-colors">Politics</button>
                            <button className="hover:text-white transition-colors">Sports</button>
                            <button className="hover:text-white transition-colors">Crypto</button>
                            <button className="hover:text-white transition-colors">Pop Culture</button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search markets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 bg-[#1C1C1E] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>
                        <button className="p-2 bg-[#1C1C1E] border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

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
