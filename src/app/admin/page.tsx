'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Hammer, Coins, Activity, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Image as ImageIcon, Calendar, PlusCircle, AlertCircle, TrendingUp, Wallet, Lock, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type TreasuryData = {
    treasuryBalance: number;
    totalLiquidityLocked: number;
    totalFeesCollected: number;
    unusedLiquidity: number;
    marketStats: {
        id: string;
        question: string;
        status: string;
        liquidity: number;
        fees: number;
        createdAt: string;
    }[];
};

export default function AdminDashboard() {
    const { user: authUser, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'liquidity' | 'factory' | 'treasury'>('liquidity');
    
    // Auth Check
    useEffect(() => {
        if (!loading && (!authUser || !authUser.isAdmin)) {
            router.push('/');
        }
    }, [authUser, loading, router]);

    // --- LIQUIDITY TERMINAL STATE ---
    const [markets, setMarkets] = useState<any[]>([]);
    const [selectedMarketId, setSelectedMarketId] = useState('');
    const [amount, setAmount] = useState('1000');
    const [isInjecting, setIsInjecting] = useState(false);
    const [injectStatus, setInjectStatus] = useState<'idle' | 'success' | 'failed'>('idle');

    useEffect(() => {
        const fetchMarkets = async () => {
            const { data } = await supabase.from('markets').select('id, question').eq('status', 'OPEN');
            setMarkets(data || []);
        };
        if (authUser?.isAdmin) fetchMarkets();
    }, [authUser]);

    const handleInjectLiquidity = async () => {
        if (!selectedMarketId || !amount || !authUser) return;
        setIsInjecting(true);
        setInjectStatus('idle');

        try {
            const { error } = await supabase.rpc('inject_liquidity', {
                p_market_id: selectedMarketId,
                p_amount_usdc: parseFloat(amount)
            });

            if (error) throw error;
            setInjectStatus('success');
            setTimeout(() => setInjectStatus('idle'), 3000);
            fetchTreasury(); // Refresh stats if in treasury
        } catch (e) {
            console.error(e);
            setInjectStatus('failed');
        } finally {
            setIsInjecting(false);
        }
    };

    // --- MARKET FACTORY STATE ---
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Politics');
    const [endTime, setEndTime] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createStatus, setCreateStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleCreateMarket = async () => {
        if (!question || !endTime || !imageFile) {
            alert('Please fill all required fields and upload an image.');
            return;
        }
        setIsCreating(true);
        setCreateStatus('idle');

        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('market-images')
                .upload(`public/${fileName}`, imageFile, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from('market-images').getPublicUrl(`public/${fileName}`);
            const imageUrl = publicUrlData.publicUrl;

            const { error: insertError } = await supabase.from('markets').insert({
                question,
                description,
                category,
                image_url: imageUrl,
                end_time: endTime,
                status: 'OPEN',
                outcome_tokens: ['Yes', 'No'],
                yes_pool: 0,
                no_pool: 0,
                total_volume_usdc: 0
            });

            if (insertError) throw insertError;

            setCreateStatus('success');
            setQuestion(''); setDescription(''); setEndTime(''); setImageFile(null); setImagePreview('');
            setTimeout(() => setCreateStatus('idle'), 3000);
            fetchTreasury();
        } catch (error) {
            console.error(error);
            setCreateStatus('failed');
        } finally {
            setIsCreating(false);
        }
    };

    // --- TREASURY STATE ---
    const [treasuryData, setTreasuryData] = useState<TreasuryData | null>(null);
    const [isFetchingTreasury, setIsFetchingTreasury] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [passcode, setPasscode] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'success' | 'failed'>('idle');

    const fetchTreasury = async () => {
        setIsFetchingTreasury(true);
        try {
            const res = await fetch('/api/admin/treasury');
            const data = await res.json();
            if (res.ok) setTreasuryData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetchingTreasury(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'treasury') {
            fetchTreasury();
        }
    }, [activeTab]);

    const handleAdminWithdrawal = async () => {
        if (!withdrawAmount || !passcode) return;
        setIsWithdrawing(true);
        setWithdrawStatus('idle');

        try {
            const res = await fetch('/api/admin/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(withdrawAmount), passcode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setWithdrawStatus('success');
            setWithdrawAmount('');
            setPasscode('');
            fetchTreasury();
            setTimeout(() => setWithdrawStatus('idle'), 3000);
        } catch (e: any) {
            alert(e.message);
            setWithdrawStatus('failed');
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading || !authUser?.isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
                
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sovereign Admin Center</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
                            Control Panel
                        </h1>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <div className="flex bg-black p-2 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('liquidity')}
                            className={`px-6 md:px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'liquidity' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Coins className="w-4 h-4" /> Liquidity
                        </button>
                        <button 
                            onClick={() => setActiveTab('factory')}
                            className={`px-6 md:px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'factory' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Hammer className="w-4 h-4" /> Factory
                        </button>
                        <button 
                            onClick={() => setActiveTab('treasury')}
                            className={`px-6 md:px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'treasury' ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <TrendingUp className="w-4 h-4" /> Treasury
                        </button>
                    </div>
                </div>

                <div className="mt-16 animate-in fade-in duration-500">
                    
                    {activeTab === 'liquidity' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-7">
                                <div className="bg-[#0c0e12] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Activity className="w-32 h-32 text-emerald-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Coins className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black tracking-tight uppercase">Liquidity Injection</h2>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Capital Allocation Layer</p>
                                            </div>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Select Market Target</label>
                                                <select value={selectedMarketId} onChange={(e) => setSelectedMarketId(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
                                                    <option value="">Choose a market...</option>
                                                    {markets.map(m => <option key={m.id} value={m.id}>{m.question}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Capital Amount (USDC)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-700">$</span>
                                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl py-6 pl-12 pr-6 text-2xl font-black text-white focus:outline-none focus:border-emerald-500/50" placeholder="1000" />
                                                </div>
                                            </div>
                                            <button onClick={handleInjectLiquidity} disabled={isInjecting || !selectedMarketId || !amount} className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl shadow-emerald-500/10">
                                                {isInjecting ? <Loader2 className="w-5 h-5 animate-spin" /> : injectStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <><span>Initialize Liquidity</span><ArrowRight className="w-4 h-4" /></>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-[#0c0e12] border border-emerald-500/10 p-8 rounded-[2.5rem] bg-emerald-500/5">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500 mb-6" />
                                    <h3 className="text-xl font-black mb-3">Sovereign Validation</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">As the Sovereign Admin, any capital you inject is permanently locked into the AMM curve. Fees accumulate to your Treasury.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'factory' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8">
                                <div className="bg-[#0c0e12] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Hammer className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black tracking-tight uppercase">Market Factory</h2>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Contract Deployment</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Market Image (Direct Upload)</label>
                                            <div onClick={() => fileInputRef.current?.click()} className={`w-full h-48 rounded-2xl border-2 border-dashed ${imagePreview ? 'border-blue-500/50' : 'border-white/10 hover:border-white/20'} flex items-center justify-center cursor-pointer overflow-hidden relative group transition-colors bg-black`}>
                                                {imagePreview ? <><img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" /><div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-black/80 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest">Change Image</span></div></> : <div className="text-center"><ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" /><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Click to Upload</span></div>}
                                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Market Question</label>
                                            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-lg font-semibold text-white focus:outline-none focus:border-blue-500/50" placeholder="e.g., Will Victor Osimhen sign for Chelsea by Aug 31?" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Expiration / Resolution Date</label>
                                            <div className="relative"><Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" /><input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm font-semibold text-white focus:outline-none focus:border-blue-500/50" /></div>
                                        </div>
                                        <button onClick={handleCreateMarket} disabled={isCreating || !question || !endTime || !imageFile} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl shadow-blue-500/10 mt-8">
                                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : createStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <><span>Deploy Market Contract</span><PlusCircle className="w-4 h-4" /></>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'treasury' && (
                        <div className="space-y-12">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Treasury Wallet (Live)</p>
                                    <p className="text-3xl font-black text-white">${treasuryData?.treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</p>
                                </div>
                                <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Deployed Liquidity</p>
                                    <p className="text-3xl font-black text-emerald-500">${treasuryData?.totalLiquidityLocked.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</p>
                                </div>
                                <div className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total 2% Revenue</p>
                                    <p className="text-3xl font-black text-blue-500">${treasuryData?.totalFeesCollected.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</p>
                                </div>
                                <div className="bg-[#0c0e12] border border-emerald-500/10 p-8 rounded-3xl bg-emerald-500/[0.02]">
                                    <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-2 italic">Unused Liquidity (Dry Powder)</p>
                                    <p className="text-3xl font-black text-white">${treasuryData?.unusedLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</p>
                                </div>
                            </div>

                            {/* Main Treasury View */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-8">
                                    <div className="bg-[#0c0e12] border border-white/5 rounded-[3rem] p-10 overflow-hidden relative shadow-2xl">
                                        <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
                                            <Eye className="w-5 h-5 text-zinc-500" /> Live Market Audit
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-white/5">
                                                        <th className="pb-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Market Question</th>
                                                        <th className="pb-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                                                        <th className="pb-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Liquidity</th>
                                                        <th className="pb-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">2% Fees</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {treasuryData?.marketStats.map(m => (
                                                        <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-6 text-sm font-semibold text-zinc-300 max-w-xs truncate pr-4">{m.question}</td>
                                                            <td className="py-6">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${m.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                                                    {m.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-6 text-sm font-black text-white tabular-nums">${m.liquidity.toLocaleString()}</td>
                                                            <td className="py-6 text-sm font-black text-blue-500 tabular-nums text-right">${m.fees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Withdrawal Section */}
                                <div className="lg:col-span-4">
                                    <div className="bg-[#0c0e12] border border-emerald-500/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden bg-emerald-500/[0.01]">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-8">
                                                <Wallet className="w-6 h-6 text-emerald-500" />
                                                <h3 className="text-xl font-black uppercase">Revenue Pull</h3>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Amount to Withdraw (USDC)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-700">$</span>
                                                        <input 
                                                            type="number" 
                                                            value={withdrawAmount}
                                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                                            className="w-full bg-black border border-white/10 rounded-2xl py-5 pl-10 pr-5 text-xl font-black text-white focus:outline-none focus:border-emerald-500/50"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                                        <Lock className="w-3 h-3" /> Treasury Passcode
                                                    </label>
                                                    <input 
                                                        type="password" 
                                                        value={passcode}
                                                        onChange={(e) => setPasscode(e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-2xl py-5 px-5 text-sm font-semibold text-white focus:outline-none focus:border-rose-500/50 placeholder:text-zinc-800"
                                                        placeholder="••••••••••••••••"
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleAdminWithdrawal}
                                                    disabled={isWithdrawing || !withdrawAmount || !passcode}
                                                    className="w-full py-5 bg-white hover:bg-emerald-500 text-black font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 disabled:opacity-20 shadow-xl"
                                                >
                                                    {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : withdrawStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 'Execute Withdrawal'}
                                                </button>

                                                <p className="text-[9px] text-zinc-500 text-center leading-relaxed italic">
                                                    Funds will be instantly credited to your Admin Profile Balance upon passcode validation.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
