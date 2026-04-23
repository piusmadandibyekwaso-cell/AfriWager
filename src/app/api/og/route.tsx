import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    width: '1200px',
                    height: '630px',
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    padding: '80px',
                    gap: '60px',
                }}
            >
                {/* Logo — Three Green Bars */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '14px',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ width: '40px', height: '100px', backgroundColor: '#10B981', borderRadius: '12px', transform: 'rotate(-15deg)', transformOrigin: 'bottom center' }} />
                    <div style={{ width: '40px', height: '145px', backgroundColor: '#10B981', borderRadius: '12px', transform: 'rotate(-15deg)', transformOrigin: 'bottom center' }} />
                    <div style={{ width: '40px', height: '195px', backgroundColor: '#10B981', borderRadius: '12px', transform: 'rotate(-15deg)', transformOrigin: 'bottom center' }} />
                </div>

                {/* Text Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '96px', fontWeight: '800', color: '#0a0a0a', lineHeight: 1 }}>
                        AfriWager
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '400', color: '#6b7280', lineHeight: 1.3 }}>
                        Africa's Largest Prediction Market
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%' }} />
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#10B981' }}>
                            afriwager.com
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
