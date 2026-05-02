'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Hammer, Coins, Activity, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Image as ImageIcon, Calendar, PlusCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user: authUser, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'liquidity' | 'factory'>('liquidity');
    
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
            // 1. Upload Image to Supabase Storage
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('market-images')
                .upload(`public/${fileName}`, imageFile, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error("Image Upload Error. Ensure 'market-images' bucket exists and is public.", uploadError);
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage.from('market-images').getPublicUrl(`public/${fileName}`);
            const imageUrl = publicUrlData.publicUrl;

            // 2. Insert Market Record
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
            // Reset form
            setQuestion(''); setDescription(''); setEndTime(''); setImageFile(null); setImagePreview('');
            setTimeout(() => setCreateStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setCreateStatus('failed');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading || !authUser?.isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
                
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
                    <div className="flex bg-black p-2 rounded-2xl border border-white/5 shadow-2xl">
                        <button 
                            onClick={() => setActiveTab('liquidity')}
                            className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'liquidity' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Coins className="w-4 h-4" /> Liquidity
                        </button>
                        <button 
                            onClick={() => setActiveTab('factory')}
                            className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'factory' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Hammer className="w-4 h-4" /> Factory
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 animate-in fade-in duration-500">
                    
                    {/* ==================================================== */}
                    {/* TAB 1: LIQUIDITY TERMINAL                            */}
                    {/* ==================================================== */}
                    {activeTab === 'liquidity' && (
                        <>
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
                                                <select 
                                                    value={selectedMarketId}
                                                    onChange={(e) => setSelectedMarketId(e.target.value)}
                                                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                                >
                                                    <option value="">Choose a market...</option>
                                                    {markets.map(m => (
                                                        <option key={m.id} value={m.id}>{m.question}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Capital Amount (USDC)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-700">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="w-full bg-black border border-white/5 rounded-2xl py-6 pl-12 pr-6 text-2xl font-black text-white focus:outline-none focus:border-emerald-500/50"
                                                        placeholder="1000"
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleInjectLiquidity}
                                                disabled={isInjecting || !selectedMarketId || !amount}
                                                className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl shadow-emerald-500/10"
                                            >
                                                {isInjecting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : injectStatus === 'success' ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <><span>Initialize Liquidity</span><ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-[#0c0e12] border border-emerald-500/10 p-8 rounded-[2.5rem] bg-emerald-500/5">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500 mb-6" />
                                    <h3 className="text-xl font-black mb-3">Sovereign Validation</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                                        As the Sovereign Admin, any capital you inject is permanently locked into the AMM curve until the market is resolved. The 2% trading fees accumulate directly to your Treasury.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ==================================================== */}
                    {/* TAB 2: MARKET FACTORY                                */}
                    {/* ==================================================== */}
                    {activeTab === 'factory' && (
                        <>
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

                                        {/* Image Upload */}
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Market Image (Direct Upload)</label>
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`w-full h-48 rounded-2xl border-2 border-dashed ${imagePreview ? 'border-blue-500/50' : 'border-white/10 hover:border-white/20'} flex items-center justify-center cursor-pointer overflow-hidden relative group transition-colors bg-black`}
                                            >
                                                {imagePreview ? (
                                                    <>
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="bg-black/80 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest">Change Image</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Click to Upload</span>
                                                    </div>
                                                )}
                                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                            </div>
                                        </div>

                                        {/* Question */}
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Market Question</label>
                                            <input 
                                                type="text" 
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-lg font-semibold text-white focus:outline-none focus:border-blue-500/50"
                                                placeholder="e.g., Will Victor Osimhen sign for Chelsea by Aug 31?"
                                            />
                                        </div>

                                        {/* Expiration Date */}
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 block ml-1">Expiration / Resolution Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                                <input 
                                                    type="datetime-local" 
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm font-semibold text-white focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleCreateMarket}
                                            disabled={isCreating || !question || !endTime || !imageFile}
                                            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl shadow-blue-500/10 mt-8"
                                        >
                                            {isCreating ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : createStatus === 'success' ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <><span>Deploy Market Contract</span><PlusCircle className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-[#0c0e12] border border-rose-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
                                    <AlertCircle className="w-8 h-8 text-rose-500 mb-6" />
                                    <h3 className="text-lg font-black mb-3">Storage Requirement</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                        For direct image uploads to work without buffering, you must ensure you have created a public Storage Bucket named <strong className="text-white">market-images</strong> in your Supabase dashboard.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
}
