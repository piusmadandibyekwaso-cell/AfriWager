import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

// ABI to decode USDC Transfer events and send USDC
const erc20Abi = [
    "function transfer(address to, uint256 amount) returns (bool)",
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
        const { type, amountUSD, txHash, withdrawAddress } = body;

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
            if (!amountUSD || currentBalance < amountUSD || amountUSD <= 0) {
                return NextResponse.json({ error: 'Insufficient funds or invalid amount' }, { status: 402 });
            }

            if (!withdrawAddress || !ethers.isAddress(withdrawAddress)) {
                return NextResponse.json({ error: 'Invalid Polygon withdrawal address' }, { status: 400 });
            }

            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) {
                console.error("Missing PRIVATE_KEY for withdrawals");
                return NextResponse.json({ error: 'Withdrawal system is temporarily offline' }, { status: 503 });
            }

            // 1. Deduct balance FIRST (to prevent race conditions / double spends)
            const newBalance = currentBalance - amountUSD;
            const { error: updateError } = await supabase
                .from('user_balances')
                .update({ balance_usdc: newBalance })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // 2. Perform Blockchain Transfer
            try {
                const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
                const wallet = new ethers.Wallet(privateKey, provider);
                const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.usdc, erc20Abi, wallet);

                // USDC has 6 decimals
                const amountToSend = ethers.parseUnits(amountUSD.toString(), 6);

                const tx = await usdcContract.transfer(withdrawAddress, amountToSend);
                const receipt = await tx.wait();

                if (receipt.status !== 1) {
                    throw new Error("Blockchain transaction failed");
                }

                // 3. Record Successful Transaction
                await supabase.from('transactions').insert({
                    user_id: user.id,
                    type: 'withdrawal',
                    amount_usdc: -amountUSD,
                    status: 'completed',
                    reference_id: `WD_${Date.now()}`,
                    metadata: { txHash: receipt.hash, toAddress: withdrawAddress, status: 'completed' }
                });

                return NextResponse.json({ success: true, newBalance, txHash: receipt.hash });

            } catch (err: any) {
                console.error("Blockchain withdrawal failed, reverting balance...", err);
                
                // CRITICAL: Revert the balance deduction if the crypto transfer fails!
                await supabase
                    .from('user_balances')
                    .update({ balance_usdc: currentBalance })
                    .eq('user_id', user.id);

                return NextResponse.json({ error: 'Blockchain transfer failed. Your funds are safe.' }, { status: 500 });
            }
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
            const iface = new ethers.Interface(erc20Abi);
            let depositAmountUSD = 0;
            let isValidTransfer = false;
            let fundingAddress = '';

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
                                fundingAddress = from;
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
            
            // 4b. Update Profile Wallet Address (if empty)
            const { data: profile } = await supabase
                .from('profiles')
                .select('last_funding_address')
                .eq('id', user.id)
                .single();

            if (profile && (!profile.last_funding_address || profile.last_funding_address === '')) {
                 await supabase
                    .from('profiles')
                    .update({ last_funding_address: fundingAddress })
                    .eq('id', user.id);
            }

            // 5. Record Transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    type: 'deposit',
                    amount_usdc: depositAmountUSD,
                    status: 'completed',
                    reference_id: `DEP_${Date.now()}`,
                    metadata: { txHash, provider: 'POLYGON', status: 'completed', fundingAddress }
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
