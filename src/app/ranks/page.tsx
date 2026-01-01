'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Target, Zap, ExternalLink, User, TrendingUp, BarChart2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TraderRank {
    wallet_address: string;
    total_volume: number;
    trade_count: number;
    rank: number;
}

export default function RanksPage() {
    const [ranks, setRanks] = useState<TraderRank[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRanks() {
            try {
                // Fetch all trades and users to aggregate
                const { data: profileData } = await supabase.from('profiles').select('id, wallet_address');
                const { data: tradesData } = await supabase.from('trades').select('user_id, usdc_amount');

                if (!profileData || !tradesData) return;

                const volumeMap = new Map<string, { volume: number; count: number; address: string }>();

                tradesData.forEach(t => {
                    const profile = profileData.find(u => u.id === t.user_id);
                    if (!profile) return;

                    const existing = volumeMap.get(profile.id) || { volume: 0, count: 0, address: profile.wallet_address };
                    existing.volume += Number(t.usdc_amount);
                    existing.count += 1;
                    volumeMap.set(profile.id, existing);
                });

                const sortedRanks: TraderRank[] = Array.from(volumeMap.values())
                    .sort((a, b) => b.volume - a.volume)
                    .map((item, index) => ({
                        wallet_address: item.address,
                        total_volume: item.volume,
                        trade_count: item.count,
                        rank: index + 1
                    }));

                setRanks(sortedRanks);
            } catch (error) {
                console.error('Error fetching ranks:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRanks();
    }, []);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="text-zinc-600 font-black">{rank}</span>;
    };

    const getTraderTier = (volume: number) => {
        if (volume > 100000) return { label: 'Whale', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        if (volume > 10000) return { label: 'Sharpshooter', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
        return { label: 'Scout', color: 'text-zinc-500', bg: 'bg-zinc-500/5 border-zinc-500/10' };
    };

    return (
        <div className="min-h-screen bg-[#060709] text-white">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-24">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 px-4">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em]">Global Leaderboard</div>
                                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Updated Real-time</div>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">Trader Ranks</h1>
                        </div>

                        <div className="flex gap-8">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Verified Users</p>
                                <p className="text-3xl font-black text-white tracking-tighter">{ranks.length}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Platform Volume</p>
                                <p className="text-3xl font-black text-emerald-500 tracking-tighter">${ranks.reduce((s, r) => s + r.total_volume, 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Top 3 Spotlight */}
                    {ranks.length >= 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
                            {[1, 0, 2].map(idx => {
                                const r = ranks[idx];
                                if (!r) return null;
                                const tier = getTraderTier(r.total_volume);
                                return (
                                    <div key={idx} className={cn(
                                        "bg-[#0c0e12] border rounded-[3rem] p-10 text-center relative overflow-hidden group transition-all hover:scale-105",
                                        idx === 0 ? "border-yellow-500/40 shadow-2xl shadow-yellow-500/10 py-14 -mt-4" : "border-zinc-800/50"
                                    )}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-center mb-6">
                                            <div className={cn(
                                                "w-20 h-20 rounded-full flex items-center justify-center border-2",
                                                idx === 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-900 border-zinc-800"
                                            )}>
                                                {idx === 0 ? <Trophy className="w-10 h-10 text-yellow-500" /> : <User className="w-8 h-8 text-zinc-700" />}
                                            </div>
                                        </div>

                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Rank #{r.rank}</p>
                                        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-tight">{r.wallet_address.slice(0, 6)}...{r.wallet_address.slice(-4)}</h3>

                                        <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Volume</p>
                                                <p className="text-2xl font-black text-emerald-500">${r.total_volume.toLocaleString()}</p>
                                            </div>
                                            <div className={cn("inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", tier.bg, tier.color)}>
                                                {tier.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Table View */}
                    <div className="bg-[#0c0e12]/50 border border-zinc-800/50 rounded-[2rem] md:rounded-[3rem] overflow-x-auto shadow-3xl">
                        <table className="w-full text-left min-w-[600px] md:min-w-0">
                            <thead className="border-b border-zinc-800/50">
                                <tr>
                                    <th className="p-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]"># Rank</th>
                                    <th className="p-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Trader Identity</th>
                                    <th className="p-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Trade Count</th>
                                    <th className="p-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Total Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-zinc-700 font-black uppercase tracking-widest italic animate-pulse">Syncing Leaderboard Data...</td>
                                    </tr>
                                ) : ranks.map((r) => (
                                    <tr key={r.rank} className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                {getRankBadge(r.rank)}
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                                                    <User className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white italic tracking-tighter uppercase">{r.wallet_address.slice(0, 10)}...{r.wallet_address.slice(-4)}</p>
                                                    <div className={cn("text-[9px] font-black uppercase tracking-widest mt-1", getTraderTier(r.total_volume).color)}>
                                                        {getTraderTier(r.total_volume).label}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-amber-500/40" />
                                                <span className="text-sm font-black text-white tabular-nums">{r.trade_count}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="w-4 h-4 text-emerald-500/40" />
                                                <span className="text-sm font-black text-emerald-500 tabular-nums">${r.total_volume.toLocaleString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
