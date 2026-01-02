import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, fiatAmount, email } = body;

        // PRODUCTION: Use Mainnet for real funds
        const API_KEY = process.env.TRANSAK_API_KEY || '4f8260b4-106d-472c-8059-e93897b9f71c'; // Default to staging if not set
        const API_URL = process.env.NODE_ENV === 'production'
            ? 'https://api.transak.com/api/v2/widget/create-url'
            : 'https://api-stg.transak.com/api/v2/widget/create-url';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: API_KEY,
                walletAddress,
                fiatAmount,
                email,
                cryptoCurrencyCode: 'USDC',
                network: 'polygon', // Switch to Polygon Mainnet
                productsAvailed: 'BUY',
                themeColor: '#10b981',
                exchangeScreenTitle: 'AfriSights Capital',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Transak API Error Details:', JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: data.error?.message || 'Transak API Error',
                details: data.error
            }, { status: response.status });
        }

        return NextResponse.json({ widgetUrl: data.response });
    } catch (error: any) {
        console.error('Transak API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
