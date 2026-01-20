import MarketsGrid from '@/components/MarketsGrid';
import Navbar from '@/components/Navbar';
import { marketService } from '@/services/marketService';

export const dynamic = 'force-dynamic'; // Ensure real-time data fetching on valid requests

export default async function MarketsPage() {
    // Server-side fetch - fast, secure, no client waterfall
    const markets = await marketService.getMarkets();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <Navbar />
            <MarketsGrid initialMarkets={markets} />
        </div>
    );
}
