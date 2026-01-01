import { useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MarketMakerABI from '@/abis/FixedProductMarketMaker.json';
import USDCABI from '@/abis/MockERC20.json';

// Minimal ERC20 Mock ABI if the file hasn't been copied
const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export function useMarket() {
    const { writeContractAsync } = useWriteContract();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const buy = useCallback(async (marketId: string, outcomeIndex: number, amount: string) => {
        try {
            const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals

            // 1. Approve Market Maker to spend USDC
            console.log('Approving USDC...');
            const approveTx = await writeContractAsync({
                address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.marketMaker as `0x${string}`, amountInWei],
            });
            console.log('Approve Tx:', approveTx);
            // Ideally wait for receipt here, but for now we proceed

            // 2. Buy Outcome Tokens
            console.log(`Buying Outcome ${outcomeIndex}...`);
            const buyTx = await writeContractAsync({
                address: CONTRACT_ADDRESSES.marketMaker as `0x${string}`,
                abi: MarketMakerABI.abi,
                functionName: 'buy',
                args: [marketId, outcomeIndex, parseUnits(amount, 6)],
            });

            // Optimistic Volume Update (User must enable RPC function via SQL)
            try {
                const { error } = await supabase.rpc('increment_market_volume', {
                    market_id: marketId,
                    amount_usdc: parseFloat(amount)
                });
                if (error) console.warn('Volume update failed (RPC missing?):', error.message);
            } catch (err) {
                console.warn('Volume update check failed:', err);
            }

            console.log('Buy Tx:', buyTx);
            return buyTx;
        } catch (error) {
            console.error('Buy Failed:', error);
            throw error;
        }
    }, [writeContractAsync]);

    return { buy };
}
