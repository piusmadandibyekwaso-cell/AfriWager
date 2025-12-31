import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, fiatAmount, email } = body;

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
                fiatAmount,
                email,
                cryptoCurrencyCode: 'USDC',
                network: 'ethereum', // Adjust to base or sepolia if supported
                productsAvailed: 'BUY',
                themeColor: '#10b981',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to create Transak URL');
        }

        return NextResponse.json({ widgetUrl: data.response.widgetUrl });
    } catch (error: any) {
        console.error('Transak API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
