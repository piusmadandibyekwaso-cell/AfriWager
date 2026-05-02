import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const ADMIN_EMAIL = 'piusmadandibyekwaso@gmail.com';

const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    // 1. Verify Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // In a real production app, we would check a 'role' column in Supabase, 
    // but per requirements, we are locking to the email identity.
    if (user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // 2. Fetch Blockchain Balance
        const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
        const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.usdc, erc20Abi, provider);
        const balanceRaw = await usdcContract.balanceOf(CONTRACT_ADDRESSES.treasury);
        const treasuryBalance = Number(ethers.formatUnits(balanceRaw, 6));

        // 3. Fetch Market Data from Supabase
        const { data: markets, error: marketError } = await supabase
            .from('markets')
            .select('*')
            .order('created_at', { ascending: false });

        if (marketError) throw marketError;

        // 4. Process Stats
        const liveMarkets = markets.filter(m => m.status === 'OPEN');
        const resolvedMarkets = markets.filter(m => m.status !== 'OPEN');

        const marketStats = markets.map(m => ({
            id: m.id,
            question: m.question,
            status: m.status,
            liquidity: (m.yes_pool || 0) + (m.no_pool || 0),
            fees: (m.total_volume_usdc || 0) * 0.02,
            createdAt: m.created_at
        }));

        const totalLiquidityLocked = liveMarkets.reduce((acc, m) => acc + (m.yes_pool || 0) + (m.no_pool || 0), 0);
        const totalFeesCollected = markets.reduce((acc, m) => acc + ((m.total_volume_usdc || 0) * 0.02), 0);
        const unusedLiquidity = treasuryBalance - totalLiquidityLocked;

        return NextResponse.json({
            treasuryBalance,
            totalLiquidityLocked,
            totalFeesCollected,
            unusedLiquidity,
            marketStats
        });

    } catch (error: any) {
        console.error('Treasury API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
