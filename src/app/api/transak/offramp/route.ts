import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, cryptoAmount, email } = body;

        // In a real production environment, you should use environment variables
        const API_KEY = '4f8260b4-106d-472c-8059-e93897b9f71c'; // Staging Key
        const API_URL = 'https://api-stg.transak.com/api/v2/widget/create-url';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: API_KEY,
                walletAddress,
                cryptoAmount,
                email,
                cryptoCurrencyCode: 'USDC',
                network: 'sepolia',
                productsAvailed: 'SELL',
                themeColor: '#10b981',
                exchangeScreenTitle: 'AfriWager Capital',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Transak Off-Ramp API Error Details:', JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: data.error?.message || 'Transak API Error',
                details: data.error
            }, { status: response.status });
        }

        return NextResponse.json({ widgetUrl: data.response });
    } catch (error: any) {
        console.error('Transak Off-Ramp Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
