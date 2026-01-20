import { marketService } from '@/services/marketService';
import MarketDetailClient from '@/components/MarketDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        id: string;
    }
}

export default async function MarketPage({ params }: PageProps) {
    const market = await marketService.getMarketById(params.id);

    if (!market) {
        notFound();
    }

    const tradeHistory = await marketService.getTradeHistory(params.id);

    // Pass server-fetched data to the client component
    return <MarketDetailClient initialMarket={market} initialTradeHistory={tradeHistory} />;
}
