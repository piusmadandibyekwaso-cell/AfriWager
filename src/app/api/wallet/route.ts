import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

// ABI to decode USDC Transfer events
const transferAbi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export async function POST(request: Request) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { type, amountUSD, txHash } = body;

        if (!['DEPOSIT', 'WITHDRAW'].includes(type)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // Get current balance
        const { data: balanceData } = await supabase
            .from('user_balances')
            .select('balance_usdc')
            .eq('user_id', user.id)
            .single();

        const currentBalance = Number(balanceData?.balance_usdc || 0);

        if (type === 'WITHDRAW') {
            if (!amountUSD || currentBalance < amountUSD) {
                return NextResponse.json({ error: 'Insufficient funds or invalid amount' }, { status: 402 });
            }
            // Standard withdrawal logic here (e.g. queueing payout)
            // For now, simply deduct balance and record transaction.

            const newBalance = currentBalance - amountUSD;

            const { error: updateError } = await supabase
                .from('user_balances')
                .update({ balance_usdc: newBalance })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'withdrawal',
                amount_usdc: -amountUSD,
                status: 'pending', // withdrawals usually pend admin approval/processing
                reference_id: `WD_${Date.now()}`,
                metadata: { status: 'pending' }
            });

            return NextResponse.json({ success: true, newBalance });
        }

        if (type === 'DEPOSIT') {
            if (!txHash) {
                return NextResponse.json({ error: 'Transaction Hash is required for deposit' }, { status: 400 });
            }

            // 1. Prevent Replay Attacks: Check if TxHash is already used
            const { data: existingTx } = await supabase
                .from('transactions')
                .select('id')
                .eq('metadata->>txHash', txHash)
                .single();

            if (existingTx) {
                return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
            }

            // 2. Verify on Blockchain
            const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
            const receipt = await provider.getTransactionReceipt(txHash);

            if (!receipt || receipt.status !== 1) {
                return NextResponse.json({ error: 'Transaction not found or failed on chain' }, { status: 400 });
            }

            // 3. Verify it's a USDC transfer to the Treasury
            const iface = new ethers.Interface(transferAbi);
            let depositAmountUSD = 0;
            let isValidTransfer = false;

            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === CONTRACT_ADDRESSES.usdc.toLowerCase()) {
                    try {
                        const parsedLog = iface.parseLog({ topics: log.topics as string[], data: log.data });
                        if (parsedLog && parsedLog.name === 'Transfer') {
                            const [from, to, value] = parsedLog.args;
                            
                            if (to.toLowerCase() === CONTRACT_ADDRESSES.treasury.toLowerCase()) {
                                // USDC has 6 decimals
                                depositAmountUSD = Number(ethers.formatUnits(value, 6));
                                isValidTransfer = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // ignore unparseable logs
                    }
                }
            }

            if (!isValidTransfer || depositAmountUSD <= 0) {
                return NextResponse.json({ error: 'Invalid deposit transaction. Must be a USDC transfer to the Treasury.' }, { status: 400 });
            }

            // 4. Credit User Balance
            const newBalance = currentBalance + depositAmountUSD;
            const { error: updateError } = await supabase
                .from('user_balances')
                .update({ balance_usdc: newBalance })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // 5. Record Transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    type: 'deposit',
                    amount_usdc: depositAmountUSD,
                    status: 'completed',
                    reference_id: `DEP_${Date.now()}`,
                    metadata: { txHash, provider: 'POLYGON', status: 'completed' }
                });

            if (txError) {
                 console.error("Failed to record deposit tx:", txError);
                 // We processed the balance, so don't fail the user, but log it.
            }

            return NextResponse.json({ success: true, newBalance, depositedAmount: depositAmountUSD });
        }

    } catch (e: any) {
        console.error('Wallet transaction failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
