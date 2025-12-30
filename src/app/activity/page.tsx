'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Activity, ArrowDownCircle, ArrowUpCircle, ExternalLink, User, Layers, ArrowRight, Zap, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActivityEvent {
    id: string;
    type: 'TRADE';
    market_question: string;
    market_id: string;
    amount: number;
    shares: number;
    is_buy: boolean;
    outcome_name: string;
    wallet_address: string;
    timestamp: string;
    tx_hash: string;
}

export default function ActivityPage() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchGlobalActivity() {
            try {
                // Fetch trades joined with users and markets
                const { data: trades, error } = await supabase
                    .from('trades')
                    .select('*, users(wallet_address), markets(question, outcome_tokens)')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                const formatted: ActivityEvent[] = trades.map(t => ({
                    id: t.id,
                    type: 'TRADE',
                    market_question: (t.markets as any).question,
                    market_id: t.market_id,
                    amount: Number(t.usdc_amount),
                    shares: Number(t.share_amount),
                    is_buy: t.is_buy,
                    outcome_name: (t.markets as any).outcome_tokens[t.outcome_index],
                    wallet_address: (t.users as any).wallet_address,
                    timestamp: t.created_at,
                    tx_hash: t.tx_hash
                }));

                setEvents(formatted);
            } catch (error) {
                console.error('Error fetching global activity:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchGlobalActivity();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('global-trades')
            .on(
                'postgres_changes' as any,
                { event: 'INSERT', table: 'trades', schema: 'public' },
                () => {
                    fetchGlobalActivity();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#060709] text-white">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-24">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Pulse
                                </div>
                                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Platform Momentum
                                </div>
                            </div>
                            <h1 className="text-6xl font-black text-white italic tracking-tighter">Global Activity</h1>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Last 50 Ledger Commits</p>
                            <div className="flex items-center gap-2 justify-end">
                                <Activity className="w-5 h-5 text-emerald-500/50" />
                                <span className="text-2xl font-black text-white tracking-tighter">Syncing...</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-24 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                                <Layers className="w-12 h-12 text-zinc-800 mx-auto mb-6 animate-spin" />
                                <p className="text-zinc-700 font-black uppercase tracking-widest text-xs">Polling Blockchain Events...</p>
                            </div>
                        ) : events.map((event) => (
                            <div key={event.id} className="bg-[#0c0e12] border border-zinc-800/50 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group hover:border-emerald-500/30 transition-all animate-in slide-in-from-right-4 duration-500">

                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 shrink-0 group-hover:scale-110 transition-transform",
                                        event.is_buy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                    )}>
                                        {event.is_buy ? <ArrowDownCircle className="w-8 h-8" /> : <ArrowUpCircle className="w-8 h-8" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                                                {event.wallet_address.slice(0, 8)}...{event.wallet_address.slice(-4)}
                                            </span>
                                            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none italic">
                                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                            {event.is_buy ? 'Acquired' : 'Liquidated'} {event.shares.toFixed(0)} <span className={event.is_buy ? 'text-emerald-500' : 'text-rose-500'}>{event.outcome_name}</span> Shares
                                        </h3>
                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight mt-1">
                                            {event.market_question}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="text-right grow md:grow-0">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Trade Value</p>
                                        <p className="text-2xl font-black text-white tracking-tighter leading-none">${event.amount.toLocaleString()}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <a
                                            href={`/markets/${event.market_id}`}
                                            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white transition-all active:scale-90"
                                            title="View Market"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </a>
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${event.tx_hash}`}
                                            target="_blank" rel="noreferrer"
                                            className="p-3 bg-zinc-900/50 hover:bg-emerald-500/10 border border-zinc-800 rounded-xl text-zinc-600 hover:text-emerald-500 transition-all active:scale-90"
                                            title="Verify Tx"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
