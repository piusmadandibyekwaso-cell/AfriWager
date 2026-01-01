'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import FPMMABI from '@/abis/FixedProductMarketMaker.json';
import USDCABI from '@/abis/MockERC20.json';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight, BarChart3, Info, ShieldCheck, AlertCircle, Droplets, Activity, Wallet, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { getCandidateImage } from '@/constants/candidateImages';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PriceChart from '@/components/PriceChart';
import { useNotifications } from '@/hooks/useNotifications';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function MarketPage() {
    const params = useParams();
    const id = params?.id as string;
    const { address } = useAccount();
    const { authenticated, login } = usePrivy();
    const { sendNotification } = useNotifications();

    const [market, setMarket] = useState<Market | null>(null);
    const [investmentAmount, setInvestmentAmount] = useState('10');
    const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tradeStep, setTradeStep] = useState<'idle' | 'approving' | 'buying' | 'success' | 'failed'>('idle');
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    // 1. Fetch Market Data & Trade History
    useEffect(() => {
        if (id) {
            marketService.getMarketById(id).then(setMarket);
            marketService.getTradeHistory(id).then(trades => {
                const formatted = trades.map((t: any) => ({
                    time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: t.outcome_index === 0 ? Number(t.usdc_amount) / Number(t.share_amount) : 1 - (Number(t.usdc_amount) / Number(t.share_amount))
                }));
                // If no trades, add a starting point
                if (formatted.length === 0) {
                    setChartData([{ time: 'Start', price: 0.5 }]);
                } else {
                    setChartData(formatted);
                }
            });
        }
    }, [id]);

    // 2. Fetch Real-time Pool Balances from AMM
    const { data: poolBalances, refetch: refetchPool } = useReadContract({
        address: market?.contract_address as `0x${string}`,
        abi: FPMMABI.abi,
        functionName: 'getPoolBalances',
        query: { enabled: !!market?.contract_address }
    });

    // 3. Calculate Real-time Prices (Generalized for N outcomes)
    const prices = useMemo(() => {
        const outcomeCount = market?.outcome_tokens?.length || 2;
        if (!poolBalances) return Array(outcomeCount).fill(1 / outcomeCount);

        const balances = poolBalances as bigint[];
        if (balances.length === 0) return Array(outcomeCount).fill(1 / outcomeCount);

        const total = balances.reduce((acc, b) => acc + Number(b), 0);
        if (total === 0) return Array(outcomeCount).fill(1 / outcomeCount);

        // Price of Outcome i = (Constant / Balance[i]) / Sum(Constant / Balance[j])
        // Simplified for FPMM: Price is proportional to shares in pool
        // However, for display, we often use the simplified reciprocal or direct balance ratio:
        return balances.map(b => (1 - (Number(b) / total)) / (outcomeCount - 1));
    }, [poolBalances, market?.outcome_tokens]);

    // 4. Estimate Shares to Receive
    const estimatedShares = useMemo(() => {
        if (!investmentAmount || isNaN(parseFloat(investmentAmount)) || !poolBalances || selectedOutcome === null) return 0;

        const amount = parseFloat(investmentAmount);
        const outcomePrice = prices[selectedOutcome];
        if (outcomePrice === 0) return 0;

        // Simple linear estimate (ignoring slippage for simplicity in UI preview)
        return amount / outcomePrice;
    }, [investmentAmount, poolBalances, selectedOutcome, prices]);

    // 5. Contract Interaction (Approval & Buy)
    const { writeContractAsync } = useWriteContract();

    const handleExecuteTrade = async () => {
        if (!market || selectedOutcome === null || !investmentAmount) return;

        try {
            const amountInWei = parseUnits(investmentAmount, 6);

            // Step 1: Approve
            setTradeStep('approving');
            const approveHash = await writeContractAsync({
                address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
                abi: USDCABI.abi,
                functionName: 'approve',
                args: [market.contract_address as `0x${string}`, amountInWei],
            });
            console.log('Approved:', approveHash);

            // Step 2: Buy
            setTradeStep('buying');
            const buyHash = await writeContractAsync({
                address: market.contract_address as `0x${string}`,
                abi: FPMMABI.abi,
                functionName: 'buy',
                args: [market.id, amountInWei, selectedOutcome, 0n], // 0n = min shares (slippage protection)
            });

            setLastTxHash(buyHash);
            setTradeStep('success');
            sendNotification('Position Opened!', {
                body: `You successfully wagered $${investmentAmount} on ${market.outcome_tokens[selectedOutcome]}.`,
            });
            refetchPool();
        } catch (error) {
            console.error('Trade Failed:', error);
            setTradeStep('failed');
        }
    };

    if (!market) return (
        <div className="min-h-screen bg-[#060709] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin opacity-20" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#060709] text-white">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT: MARKET CONTENT (7 cols) */}
                    <div className="lg:col-span-12 xl:col-span-8">
                        <div className="relative h-[450px] w-full rounded-[3rem] overflow-hidden mb-12 group shadow-2xl">
                            <img src={market.image_url} alt={market.question} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-transparent to-transparent opacity-90" />

                            <div className="absolute bottom-0 left-0 p-12 w-full">
                                <div className="flex gap-3 mb-6">
                                    <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">{market.category}</span>
                                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md">Ends Dec 2024</span>
                                </div>
                                <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-none mb-4 max-w-3xl">{market.question}</h1>
                                <p className="text-white/40 text-sm md:text-lg font-medium max-w-2xl leading-relaxed">{market.description}</p>
                            </div>
                        </div>

                        {/* Market Metadata Tabs */}
                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-6 mb-8 border-b border-zinc-800/50 pb-6 text-xs font-black tracking-widest uppercase text-zinc-500">
                                <button className="text-emerald-500 border-b-2 border-emerald-500 pb-6 -mb-[26px]">Market Odds</button>
                                <button className="hover:text-white transition-colors">Order Book</button>
                                <button className="hover:text-white transition-colors">Positions</button>
                            </div>

                            <div className="py-8">
                                <div className="flex items-baseline justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Probability Flux</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {['1D', '1W', '1M', 'ALL'].map(t => (
                                            <button key={t} className="px-3 py-1 bg-zinc-900 rounded-lg text-[9px] font-black text-zinc-600 hover:text-white transition-colors">{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <PriceChart data={chartData} />

                                {/* Market Stats Bar */}
                                <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-zinc-800/50">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Total Volume</span>
                                        </div>
                                        <p className="text-xl font-black text-white italic tracking-tighter">${market.total_volume_usdc.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <Droplets className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Liquidity</span>
                                        </div>
                                        <p className="text-xl font-black text-white italic tracking-tighter">$124.5K</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <Info className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">24h Change</span>
                                        </div>
                                        <p className="text-xl font-black text-emerald-500 italic tracking-tighter">+4.2%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: TRADING TERMINAL (4 cols) */}
                    <div className="lg:col-span-12 xl:col-span-4 mt-8 xl:mt-0">
                        <div className="bg-[#0c0e12] border border-zinc-800/80 rounded-[3rem] p-6 md:p-10 shadow-3xl xl:sticky xl:top-32">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Terminal</h2>
                                <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-lg">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Flow</span>
                                </div>
                            </div>

                            {/* Investment Input */}
                            <div className="mb-10">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 block ml-1">Investment (USDC)</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-800 group-focus-within:text-emerald-500 transition-colors">$</span>
                                    <input
                                        type="number"
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                        className="w-full bg-[#060709] border-2 border-zinc-800/50 rounded-2xl py-6 pl-12 pr-6 text-2xl font-black text-white focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-zinc-900"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Outcome Buttons */}
                            {/* Outcome Buttons / Campaign Posters */}
                            <div className={cn(
                                "grid gap-4 mb-10",
                                market.category === 'Politics' ? "grid-cols-2" : "grid-cols-2"
                            )}>
                                {market.outcome_tokens.map((outcome, index) => {
                                    const candidateImage = market.category === 'Politics' ? getCandidateImage(outcome) : null;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedOutcome(index)}
                                            className={cn(
                                                "relative overflow-hidden group transition-all duration-300 ease-out active:scale-95",
                                                market.category === 'Politics'
                                                    ? "h-64 rounded-[2rem] border-0" // Politics Card Style
                                                    : "p-8 rounded-3xl border-2 flex flex-col items-center justify-center", // Default Style
                                                selectedOutcome === index
                                                    ? (index === 0 ? "ring-4 ring-emerald-500/50" : "ring-4 ring-rose-500/50")
                                                    : "hover:opacity-90",
                                                market.category !== 'Politics' && (selectedOutcome === index
                                                    ? (index === 0 ? "bg-emerald-500/10 border-emerald-500/50" : "bg-rose-500/10 border-rose-500/50")
                                                    : "bg-[#060709] border-zinc-800/50 hover:border-zinc-700")
                                            )}
                                        >
                                            {/* CAMPAIGN POSTER IMAGE (Politics Only) */}
                                            {candidateImage && (
                                                <div className="absolute inset-0 bg-zinc-800 animate-pulse">
                                                    <img
                                                        src={candidateImage}
                                                        alt={outcome}
                                                        referrerPolicy="no-referrer"
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
                                                </div>
                                            )}

                                            {/* Selected Overlay */}
                                            {selectedOutcome === index && (
                                                <div className={cn(
                                                    "absolute inset-0 border-[6px] rounded-[2rem] z-20",
                                                    index === 0 ? "border-emerald-500" : "border-amber-500"
                                                )} />
                                            )}

                                            {/* CONTENT */}
                                            <div className={cn(
                                                "relative z-10 flex flex-col items-center justify-center h-full w-full",
                                                market.category === 'Politics' ? "justify-end pb-6" : ""
                                            )}>
                                                <div className={cn(
                                                    "font-black tracking-tighter mb-1 shadow-black drop-shadow-lg",
                                                    market.category === 'Politics' ? "text-4xl text-white" : "text-5xl",
                                                    market.category !== 'Politics' && (index === 0 ? "text-emerald-500" : "text-amber-500")
                                                )}>
                                                    {(prices[index] * 100).toFixed(0)}¢
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                                    market.category === 'Politics' ? "text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md" : "text-zinc-500 group-hover:text-white"
                                                )}>{outcome}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Execution Summary Preview */}
                            {selectedOutcome !== null && (
                                <div className="mb-10 p-6 bg-[#060709] rounded-3xl border border-zinc-800/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-4">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Est. Shares</span>
                                        <span className="text-lg font-black text-white">{estimatedShares.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Max Payout</span>
                                        <span className="text-lg font-black text-emerald-500">${estimatedShares.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => authenticated ? setIsConfirmModalOpen(true) : login()}
                                disabled={selectedOutcome === null || !investmentAmount}
                                className="w-full py-6 bg-white hover:bg-zinc-200 disabled:opacity-5 text-black font-black rounded-[1.5rem] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                            >
                                {authenticated ? "Prepare Wager" : "Sign in to Trade"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRADE CONFIRMATION MODAL */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-[#0c0e12] border border-zinc-800 w-full max-w-sm rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-zinc-800/50">
                            <h3 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" /> Review Trade
                            </h3>
                            <button onClick={() => { setIsConfirmModalOpen(false); setTradeStep('idle'); }} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-600">
                                <AlertCircle className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-10">
                            {tradeStep === 'idle' && (
                                <div className="space-y-8">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Investment Allocation</p>
                                        <div className="text-6xl font-black text-white tracking-tighter mb-2">${investmentAmount}</div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">on {selectedOutcome === 0 ? "YES" : "NO"} Outcome</div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between p-4 bg-zinc-900/50 rounded-2xl">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price / Share</span>
                                            <span className="text-xs font-black text-white">{prices[selectedOutcome!].toFixed(2)} USDC</span>
                                        </div>
                                        <div className="flex justify-between p-4 bg-zinc-900/50 rounded-2xl">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Fee</span>
                                            <span className="text-xs font-black text-emerald-500">~0.01 MATIC</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleExecuteTrade}
                                        className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-3xl transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-widest text-[10px]"
                                    >
                                        Execute Contract
                                    </button>
                                </div>
                            )}

                            {tradeStep === 'approving' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-8" />
                                    <h4 className="text-lg font-black uppercase italic tracking-widest mb-2">Stage 1: Approval</h4>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">Authorizing Market Maker to use your USDC funds.</p>
                                </div>
                            )}

                            {tradeStep === 'buying' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-8" />
                                    <h4 className="text-lg font-black uppercase italic tracking-widest mb-2">Stage 2: Execution</h4>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">Finalizing wager on the Polygon Mainnet ledger.</p>
                                </div>
                            )}

                            {tradeStep === 'success' && (
                                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Position Open</h4>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-10">Your shares have been minted.</p>

                                    <div className="grid grid-cols-1 gap-3 w-full">
                                        <button
                                            onClick={() => { setIsConfirmModalOpen(false); setTradeStep('idle'); }}
                                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                                        >
                                            Done
                                        </button>
                                        {lastTxHash && (
                                            <a
                                                href={`https://polygonscan.com/tx/${lastTxHash}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                                            >
                                                View on Polygonscan <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {tradeStep === 'failed' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <AlertCircle className="w-16 h-16 text-rose-500 mb-8" />
                                    <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Transaction Denied</h4>
                                    <p className="text-zinc-500 text-xs font-bold mb-10 max-w-[240px]">The transaction was rejected or failed on-chain. Please check your gas (MATIC) balance.</p>
                                    <button onClick={() => setTradeStep('idle')} className="w-full py-5 bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">
                                        Back to Review
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
