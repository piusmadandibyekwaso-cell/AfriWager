
import { NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const markets = await marketService.getMarkets();
        return NextResponse.json({
            count: markets.length,
            markets: markets.map(m => ({
                id: m.id,
                question: m.question,
                image_url: m.image_url,
                category: m.category
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
