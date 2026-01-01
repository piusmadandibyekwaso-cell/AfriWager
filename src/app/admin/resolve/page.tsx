'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import { Loader2, ShieldAlert, Gavel, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import ConditionalTokensABI from '@/abis/ConditionalTokens.json';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

// SECURITY: Only this wallet can see the dashboard
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function AdminResolvePage() {
    const { ready, authenticated, user, login } = usePrivy();
    const { address } = useAccount();
    const [markets, setMarkets] = useState<Market[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { writeContractAsync } = useWriteContract();

    // Fetch Markets
    useEffect(() => {
        const load = async () => {
            const data = await marketService.getMarkets();
            setMarkets(data);
            setIsLoading(false);
        };
        load();
    }, []);

    // Resolution Logic
    const handleResolve = async (market: Market, outcomeIndex: number) => {
        if (!confirm(`ARE YOU SURE?\n\nSetting Winner: ${market.outcome_tokens[outcomeIndex]}\n\nThis cannot be undone.`)) return;

        try {
            // ConditionalTokens.reportPayouts(questionId, payouts[])
            // For binary YES/NO: 
            // If YES wins (Index 0): payouts = [1, 0]
            // If NO wins (Index 1): payouts = [0, 1]

            const payouts = Array(market.outcome_tokens.length).fill(0);
            payouts[outcomeIndex] = 1;

            const tx = await writeContractAsync({
                address: CONTRACT_ADDRESSES.conditionalTokens as `0x${string}`,
                abi: ConditionalTokensABI.abi,
                functionName: 'reportPayouts',
                args: [market.condition_id, payouts]
            });

            alert(`Resolution Transaction Sent!\nHash: ${tx}`);
        } catch (error) {
            console.error(error);
            alert('Resolution Failed. Check Console.');
        }
    };

    // 1. Loading State
    if (!ready || isLoading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        </div>
    );

    // 2. Security Gate (Admin Only)
    // CRITICAL FIX: Whitelist specific user wallet + Env Var
    const ADMIN_WALLETS = [
        ADMIN_WALLET?.toLowerCase(),
        "0x9f717cf22ebb3ab8fb95b68ec845ae79be434a13" // User's Privy Wallet
    ].filter(Boolean);

    const isAdmin = !!user?.wallet?.address &&
        ADMIN_WALLETS.includes(user.wallet.address.toLowerCase());

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert className="w-24 h-24 text-rose-500 mb-6" />
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Restricted Access</h1>
                <p className="text-zinc-500 max-w-md mb-8">This frequency is encrypted. Only the designated Oracle can access this terminal.</p>

                {!authenticated ? (
                    <button onClick={login} className="px-8 py-3 bg-white text-black font-black rounded-full uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors">
                        Authenticate
                    </button>
                ) : (
                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Your Wallet</p>
                        <p className="font-mono text-rose-400">{user?.wallet?.address}</p>
                    </div>
                )}
            </div>
        );
    }

    // 3. Admin Dashboard
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-24">

                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-4">
                            <Gavel className="w-10 h-10 text-amber-500" /> Resolution Desk
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">God Mode Active • {markets.length} Markets Pending</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Oracle Online</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {markets.map((market) => (
                        <div key={market.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 hover:border-white/10 transition-colors group">

                            {/* Market Info */}
                            <div className="flex items-center gap-6 flex-1">
                                <img src={market.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                                <div>
                                    <h3 className="text-xl font-black tracking-tight leading-none mb-2">{market.question}</h3>
                                    <div className="flex gap-3">
                                        <span className="text-xs font-mono text-zinc-500">{market.id.slice(0, 8)}...</span>
                                        <span className="text-xs font-bold text-emerald-500">${market.total_volume_usdc.toLocaleString()} Volume</span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Actions */}
                            <div className="flex gap-4">
                                {market.outcome_tokens.map((outcome, idx) => (
                                    <button
                                        key={outcome}
                                        onClick={() => handleResolve(market, idx)}
                                        className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-transparent
                                            ${idx === 0
                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20'
                                            }`}
                                    >
                                        Resolve: {outcome}
                                    </button>
                                ))}
                                <button className="p-4 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                    ))}

                    {markets.length === 0 && (
                        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
                            <p className="text-zinc-500 font-bold">No Active Markets to Resolve</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
