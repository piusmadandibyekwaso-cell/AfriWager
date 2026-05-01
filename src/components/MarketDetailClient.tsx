'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import { useAuth } from '@/context/AuthContext';
import { 
    ArrowRight, BarChart3, Info, ShieldCheck, AlertCircle, 
    Droplets, Activity, Wallet, Loader2, CheckCircle2, 
    ExternalLink, ChevronRight, TrendingUp, Users, Clock, Share2
} from "lucide-react";
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
    const [activeTab, setActiveTab] = useState<'orderbook' | 'positions' | 'activity'>('activity');

    // Simulate "First Trade of the Month" detection for the UI audit
    const isFirstTradeOfMonth = true;
    const networkFee = isFirstTradeOfMonth ? 0.15 : 0;
    const totalCost = parseFloat(investmentAmount || '0') + networkFee;

    // 4. Off-Chain Trade Execution (AfriVault Ledger)
    const handleExecuteTrade = async () => {
        if (!market || selectedOutcome === null || !investmentAmount || !authUser) return;

        try {
            const amountUSD = parseFloat(investmentAmount);
            if (authUser.balance !== undefined && authUser.balance < totalCost) {
                alert(`Insufficient AfriVault Balance. You need $${totalCost.toFixed(2)} to cover the trade + network fee.`);
                return;
            }

            setTradeStep('buying');
            setErrorMessage(null);

            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId: market.id,
                    outcomeIndex: selectedOutcome,
                    amountUSD: amountUSD, // Trade amount
                    networkFee: networkFee, // Passed to backend to route to AfriVault Treasury
                    type: 'EXECUTE'
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Trade Failed');

            setTradeStep('success');
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

    const prices = useMemo(() => {
        if (!market || !market.yes_pool || !market.no_pool) return [0.5, 0.5];
        const yes = Number(market.yes_pool);
        const no = Number(market.no_pool);
        const total = yes + no;
        if (total === 0) return [0.5, 0.5];
        return [no / total, yes / total];
    }, [market]);

    const estimatedShares = useMemo(() => {
        if (!investmentAmount || isNaN(parseFloat(investmentAmount)) || selectedOutcome === null || !market?.yes_pool) return 0;
        const amount = parseFloat(investmentAmount);
        const yesPool = Number(market.yes_pool);
        const noPool = Number(market.no_pool);
        const k = yesPool * noPool;
        const invest = amount * 0.98; // 2% fee estimate

        if (selectedOutcome === 0) {
            const newNoPool = noPool + invest;
            const newYesPool = k / newNoPool;
            return invest + (yesPool - newYesPool);
        } else {
            const newYesPool = yesPool + invest;
            const newNoPool = k / newYesPool;
            return invest + (noPool - newNoPool);
        }
    }, [investmentAmount, market, selectedOutcome]);

    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
                {/* Minimalist Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">
                        <span className="hover:text-emerald-500 cursor-pointer transition-colors">{market.category}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-zinc-600">Market Detail</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-6 text-white">
                                {market.question}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Ends {new Date(market.end_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{market.total_volume_usdc.toLocaleString()} Volume</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>Oracle: Official Reports</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        
                        {/* Market Image & Chart Area */}
                        <div className="bg-[#0c0e12] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-3">
                                <div className="md:col-span-1 h-full min-h-[250px] border-r border-white/5">
                                    <img 
                                        src={market.image_url} 
                                        alt={market.question} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="md:col-span-2 p-8 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Probability History</span>
                                        </div>
                                    </div>
                                    <PriceChart data={chartData} />
                                </div>
                            </div>
                        </div>

                        {/* Outcome List - Polymarket Style */}
                        <div className="bg-[#0c0e12] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Market Outcomes</h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {market.outcome_tokens.map((outcome, index) => {
                                    const currentPrice = prices[index] || 0.5;
                                    const isSelected = selectedOutcome === index;
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={cn(
                                                "group flex items-center justify-between p-6 transition-colors",
                                                isSelected ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all",
                                                    index === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
                                                    isSelected && "ring-1 ring-white/20"
                                                )}>
                                                    {outcome[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-zinc-100">{outcome}</p>
                                                    <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-tight">{market.category} Market</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-white tabular-nums">{(currentPrice * 100).toFixed(0)}%</p>
                                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Chance</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedOutcome(index)}
                                                    className={cn(
                                                        "px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                                        index === 0 
                                                            ? (isSelected ? "bg-emerald-500 text-black" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20")
                                                            : (isSelected ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20")
                                                    )}
                                                >
                                                    {outcome}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description & Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-[#0c0e12] border border-white/5 rounded-3xl p-10 shadow-2xl">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" /> Market Details
                                </h3>
                                <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">
                                    {market.description}
                                </p>
                            </div>
                            <div className="bg-[#0c0e12] border border-white/5 rounded-3xl p-10 shadow-2xl">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" /> Stats Overview
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">24h Volume</span>
                                        <span className="text-sm font-black text-white">$12,450.00</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/5 pt-6">
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Total Liquidity</span>
                                        <span className="text-sm font-black text-emerald-500">${((market.yes_pool || 0) + (market.no_pool || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Terminal */}
                    <div className="lg:col-span-4 sticky top-32">
                        <div className="bg-[#0c0e12] border border-white/5 rounded-2xl p-8 shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-24 h-24 text-emerald-500" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-semibold tracking-tight uppercase">Order</h2>
                                    <div className="flex items-center gap-2 p-1.5 bg-black rounded-lg border border-white/5">
                                        <span className="w-1.2 h-1.2 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">AfriVault Live</span>
                                    </div>
                                </div>
 
                                 {/* Investment Input */}
                                 <div className="mb-8">
                                     <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block ml-1">Investment (USDC)</label>
                                     <div className="relative">
                                         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-semibold text-zinc-800">$</span>
                                         <input
                                             type="number"
                                             value={investmentAmount}
                                             onChange={(e) => setInvestmentAmount(e.target.value)}
                                             className="w-full bg-black border border-white/5 rounded-xl py-4 pl-10 pr-5 text-xl font-semibold text-white focus:outline-none focus:border-white/20 transition-all"
                                             placeholder="0.00"
                                         />
                                     </div>
                                 </div>
 
                                 {/* Summary Grid */}
                                 {selectedOutcome !== null && (
                                     <div className="mb-8 p-6 bg-black rounded-xl border border-white/5 space-y-4">
                                         <div className="flex justify-between items-center text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                             <span>Outcome</span>
                                             <span className="text-white font-bold">{market.outcome_tokens[selectedOutcome]}</span>
                                         </div>
                                         <div className="flex justify-between items-center text-[10px] font-medium text-zinc-500 uppercase tracking-wider border-t border-white/5 pt-4">
                                             <span>Est. Payout</span>
                                             <span className="text-base font-bold text-emerald-500">${estimatedShares.toFixed(2)}</span>
                                         </div>
                                     </div>
                                 )}
 
                                 <button
                                     onClick={() => authUser ? setIsConfirmModalOpen(true) : openAuthModal()}
                                     disabled={selectedOutcome === null || !investmentAmount}
                                     className="w-full py-5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl transition-all uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 disabled:opacity-20"
                                 >
                                     {authUser ? "Place Order" : "Sign in to Trade"}
                                     <ArrowRight className="w-3.5 h-3.5" />
                                 </button>
                                 
                                 <div className="mt-6 flex justify-center gap-4">
                                     <button className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1.5">
                                         <Share2 className="w-3 h-3" /> Share
                                     </button>
                                     <button className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1.5">
                                         <ShieldCheck className="w-3 h-3" /> Audit
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </main>
 
             {/* CONFIRMATION MODAL - CLEANER VERSION */}
             {isConfirmModalOpen && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                     <div className="bg-[#0c0e12] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                         <div className="p-8 text-center">
                             <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <ShieldCheck className="w-6 h-6 text-emerald-500" />
                             </div>
                             <h3 className="text-xl font-bold mb-2">Confirm Order</h3>
                             <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider mb-8 leading-relaxed">
                                 Buy <span className="text-white">${investmentAmount}</span> of <span className="text-white">{market.outcome_tokens[selectedOutcome!]}</span>
                             </p>
                             
                             <div className="space-y-3 mb-8">
                                 {isFirstTradeOfMonth && (
                                     <div className="flex justify-between p-4 bg-black rounded-xl border border-white/5">
                                         <div className="flex flex-col">
                                            <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">Network Routing Fee</span>
                                            <span className="text-[8px] text-zinc-700 italic">(First trade of the month only)</span>
                                         </div>
                                         <span className="text-xs font-bold text-rose-500">${networkFee.toFixed(2)}</span>
                                     </div>
                                 )}
                                 <div className="flex justify-between p-4 bg-black rounded-xl border border-white/5">
                                     <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">Total Cost</span>
                                     <span className="text-xs font-bold text-white">${totalCost.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between p-4 bg-black rounded-xl border border-white/5">
                                     <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">Est. Payout</span>
                                     <span className="text-xs font-bold text-emerald-500">${estimatedShares.toFixed(2)}</span>
                                 </div>
                             </div>
 
                             <div className="flex flex-col gap-3">
                                 {tradeStep === 'buying' ? (
                                     <div className="py-2 flex justify-center"><Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /></div>
                                 ) : (
                                     <>
                                         <button 
                                             onClick={handleExecuteTrade}
                                             className="w-full py-5 bg-emerald-500 text-black font-bold rounded-xl uppercase tracking-wider text-[10px]"
                                         >
                                             Confirm Order
                                         </button>
                                         <button 
                                             onClick={() => setIsConfirmModalOpen(false)}
                                             className="w-full py-4 bg-transparent text-zinc-600 hover:text-white font-bold rounded-xl uppercase tracking-wider text-[10px]"
                                         >
                                             Cancel
                                         </button>
                                     </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
