import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, amount, txHash, walletAddress } = body;

        // Basic validation
        if (!email || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: email or amount' },
                { status: 400 }
            );
        }

        // Send Email
        const data = await resend.emails.send({
            from: 'AfriSights <onboarding@resend.dev>', // Change this to 'noreply@afrisights.com' after domain verification
            to: [email],
            subject: 'Funds Received - AfriSights',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Funding Confirmed</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { text-align: center; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -1px; text-decoration: none; }
                .card { background-color: #111111; border: 1px solid #333333; border-radius: 16px; padding: 40px; text-align: center; }
                .success-icon { color: #10b981; font-size: 48px; margin-bottom: 24px; }
                .amount { font-size: 48px; font-weight: 800; color: #ffffff; margin: 10px 0; letter-spacing: -2px; }
                .label { color: #888888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 30px; }
                .details { text-align: left; background-color: #000000; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #cccccc; }
                .detail-row:last-child { margin-bottom: 0; }
                .detail-value { font-family: monospace; color: #ffffff; }
                .button { display: inline-block; background-color: #10b981; color: #000000; padding: 16px 32px; border-radius: 50px; font-weight: 700; text-decoration: none; font-size: 14px; transition: all 0.2s; }
                .footer { text-align: center; color: #666666; font-size: 12px; margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <a href="https://afrisights.com" class="logo">AfriSights</a>
                </div>
                
                <div class="card">
                    <div class="success-icon">✓</div>
                    <h1 style="margin: 0; font-size: 24px;">Funding Successful</h1>
                    <div class="amount">$${amount}</div>
                    <div class="label">USDC Added to Wallet</div>
                    
                    <div class="details">
                        <div class="detail-row">
                            <span>Wallet</span>
                            <span class="detail-value">${walletAddress ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span>Network</span>
                            <span class="detail-value">Polygon Mainnet</span>
                        </div>
                        <div class="detail-row">
                            <span>Date</span>
                            <span class="detail-value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <a href="https://afrisights.com/funds" class="button">View Balance</a>
                </div>

                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} AfriSights. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
        });

        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
