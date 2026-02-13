'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, BarChart3, Info, ShieldCheck, AlertCircle, Droplets, Activity, Wallet, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { getCandidateImage } from '@/constants/candidateImages';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PriceChart from '@/components/PriceChart';
import { useNotifications } from '@/hooks/useNotifications';
import { useParams } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MarketDetailClientProps {
    initialMarket: Market;
    initialTradeHistory: any[];
}

export default function MarketDetailClient({ initialMarket, initialTradeHistory }: MarketDetailClientProps) {
    const { user: authUser, openAuthModal } = useAuth();
    const { sendNotification } = useNotifications();

    const [market, setMarket] = useState<Market>(initialMarket);
    const [investmentAmount, setInvestmentAmount] = useState('10');
    const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tradeStep, setTradeStep] = useState<'idle' | 'approving' | 'buying' | 'success' | 'failed'>('idle');
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    // 4. Off-Chain Trade Execution (AfriVault Ledger)
    const handleExecuteTrade = async () => {
        if (!market || selectedOutcome === null || !investmentAmount || !authUser) return;

        try {
            const amountUSD = parseFloat(investmentAmount);
            if (authUser.balance !== undefined && authUser.balance < amountUSD) {
                // UI check only, API enforces this too
                alert("Insufficient AfriVault Balance. Please Deposit funds.");
                return;
            }

            setTradeStep('buying');
            setErrorMessage(null); // Reset error

            // Call AfriVault API
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId: market.id,
                    outcomeIndex: selectedOutcome,
                    amountUSD: amountUSD,
                    type: 'EXECUTE'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Trade Failed');
            }

            // Success Execution
            setLastTxHash(null); // No on-chain hash
            setTradeStep('success');

            // Refresh Market Data to update prices immediately
            marketService.getMarketById(market.id).then((updatedMarket) => {
                if (updatedMarket) setMarket(updatedMarket);
            });

            sendNotification('Position Opened!', {
                body: `You successfully invested $${investmentAmount} on ${market.outcome_tokens[selectedOutcome]}.`,
            });

        } catch (error: any) {
            console.error('Trade Failed:', error);
            setErrorMessage(error.message || "Unknown error occurred");
            setTradeStep('failed');
        }
    };

    // ... (inside render)


    useEffect(() => {
        if (initialTradeHistory && initialTradeHistory.length > 0) {
            const formatted = initialTradeHistory.map((t: any) => ({
                time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                price: t.outcome_index === 0 ? Number(t.usdc_amount) / Number(t.share_amount) : 1 - (Number(t.usdc_amount) / Number(t.share_amount))
            }));
            setChartData(formatted);
        } else {
            setChartData([{ time: 'Start', price: 0.5 }]);
        }
    }, [initialTradeHistory]);

    // real-time updates (optional, keeping it simple for now)

    // 2. Real-time Prices from DB Pools (CPMM)
    const prices = useMemo(() => {
        if (!market || !market.yes_pool || !market.no_pool) return [0.5, 0.5];

        const yes = Number(market.yes_pool);
        const no = Number(market.no_pool);
        const total = yes + no;

        if (total === 0) return [0.5, 0.5];

        // Price = Ratio of OPPOSITE pool / Total
        // Price(YES) = NO / (YES + NO)
        const priceYes = no / total;
        const priceNo = yes / total;

        return [priceYes, priceNo];
    }, [market]);

    // 3. Estimate Shares to Receive
    const estimatedShares = useMemo(() => {
        if (!investmentAmount || isNaN(parseFloat(investmentAmount)) || selectedOutcome === null || !market?.yes_pool) return 0;

        const amount = parseFloat(investmentAmount);
        // CPMM Calculation with Price Impact
        // k = x * y
        // Buy YES: Add amount to NO pool (dy), Find new Yes Pool (x') = k / (y + dy)
        // Shares Out = x - x'

        const yesPool = Number(market.yes_pool);
        const noPool = Number(market.no_pool);
        const k = yesPool * noPool;
        const fee = amount * 0.02; // 2% fee estimate
        const invest = amount - fee;

        if (selectedOutcome === 0) { // YES
            const newNoPool = noPool + invest;
            const newYesPool = k / newNoPool;
            // Split + Swap Logic: Shares = Invest + (YesPool - NewYesPool)
            return invest + (yesPool - newYesPool);
        } else { // NO
            const newYesPool = yesPool + invest;
            const newNoPool = k / newYesPool;
            // Split + Swap Logic: Shares = Invest + (NoPool - NewNoPool)
            return invest + (noPool - newNoPool);
        }
    }, [investmentAmount, market, selectedOutcome]);




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
                                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md">Ends {new Date(market.end_date).toLocaleDateString()}</span>
                                </div>
                                <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-none mb-4 max-w-3xl">{market.question}</h1>
                                <p className="text-white/40 text-sm md:text-lg font-medium max-w-2xl leading-relaxed">{market.description}</p>
                                <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
                                    <span className="font-bold uppercase tracking-widest text-[#10b981]">Oracle Source:</span>
                                    <span>Reuters / Bloomberg / URA Official Reports</span>
                                </div>
                            </div>
                        </div>

                        {/* Market Metadata Tabs */}
                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-6 mb-8 border-b border-zinc-800/50 pb-6 text-xs font-black tracking-widest uppercase text-zinc-500">
                                <button className="text-emerald-500 border-b-2 border-emerald-500 pb-6 -mb-[26px]">Market Prices</button>
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
                                        {/* Dynamic Liquidity based on Pools */}
                                        <p className="text-xl font-black text-white italic tracking-tighter">${((market.yes_pool || 0) + (market.no_pool || 0)).toLocaleString()}</p>
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
                            <div className={cn(
                                "grid gap-4 mb-10",
                                market.category === 'Politics' ? "grid-cols-2" : "grid-cols-2"
                            )}>
                                {market.outcome_tokens.map((outcome, index) => {
                                    const candidateImage = market.category === 'Politics' ? getCandidateImage(outcome) : null;
                                    const currentPrice = prices[index] || 0.5;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedOutcome(index)}
                                            className={cn(
                                                "relative overflow-hidden group transition-all duration-300 ease-out active:scale-95",
                                                market.category === 'Politics'
                                                    ? "h-64 rounded-[2rem] border-0"
                                                    : "p-8 rounded-3xl border-2 flex flex-col items-center justify-center",
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
                                                    {(currentPrice * 100).toFixed(0)}¢
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
                                    {/* CPMM Slippage Warning if Impact > 5% */}
                                    {estimatedShares > 0 && Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome]) > 0.05 && (
                                        <div className="mt-4 flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 p-2 rounded-lg">
                                            <AlertCircle className="w-3 h-3" />
                                            High Price Impact (Whale Trade)
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => authUser ? setIsConfirmModalOpen(true) : openAuthModal()}
                                disabled={selectedOutcome === null || !investmentAmount}
                                className="w-full py-6 bg-white hover:bg-zinc-200 disabled:opacity-5 text-black font-black rounded-[1.5rem] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                            >
                                {authUser ? "Prepare Trade" : "Sign in to Trade"}
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

                                    {/* Guardian Protocol: Slipper & ROI Display */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Est. Shares</span>
                                            <span className="text-xs font-black text-white">{estimatedShares.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price Impact</span>
                                            <span className={cn(
                                                "text-xs font-black",
                                                (Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) > 0.10 ? "text-rose-500" :
                                                    (Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) > 0.05 ? "text-amber-500" : "text-emerald-500"
                                            )}>
                                                {((Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) * 100).toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="flex justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="w-3 h-3 text-zinc-500" />
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Balance</span>
                                            </div>
                                            <span className={cn("text-xs font-black", (authUser?.balance || 0) < Number(investmentAmount) ? "text-rose-500" : "text-white")}>
                                                ${authUser?.balance?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>

                                        {/* ROI WARNING */}
                                        {estimatedShares < Number(investmentAmount) && (
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-tight">NEGATIVE RETURN: PAYOUT &lt; COST</span>
                                            </div>
                                        )}

                                        {/* SLIPPAGE WARNING */}
                                        {(Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) > 0.10 && (
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-tight">High Slippage: &gt;10% Impact</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleExecuteTrade}
                                        disabled={
                                            (authUser?.balance || 0) < Number(investmentAmount) ||
                                            estimatedShares < Number(investmentAmount) ||
                                            ((Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) > 0.10)
                                        }
                                        className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black rounded-3xl transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-widest text-[10px]"
                                    >
                                        {(authUser?.balance || 0) < Number(investmentAmount) ? "INSUFFICIENT BALANCE" :
                                            estimatedShares < Number(investmentAmount) ? "NEGATIVE ROI: TRADE BLOCKED" :
                                                ((Math.abs((Number(investmentAmount) / estimatedShares) - prices[selectedOutcome!]) / prices[selectedOutcome!]) > 0.10) ? "GUARDIAN BLOCK: HIGH SLIPPAGE" :
                                                    "EXECUTE CONTRACT"}
                                    </button>
                                </div>
                            )}

                            {tradeStep === 'buying' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-8" />
                                    <h4 className="text-lg font-black uppercase italic tracking-widest mb-2">Processing Trade</h4>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">Updating AfriVault Ledger...</p>
                                </div>
                            )}

                            {tradeStep === 'success' && (
                                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Position Open</h4>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-10">Your shares are now recorded in AfriVault.</p>

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
                                    <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Trade Failed</h4>
                                    <p className="text-rose-400 text-xs font-bold mb-10 max-w-[240px] border border-rose-500/20 bg-rose-500/10 p-4 rounded-xl">
                                        {errorMessage || "The transaction could not be processed. Please check your AfriVault balance."}
                                    </p>
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
