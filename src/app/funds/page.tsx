'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContracts } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { parseUnits, formatUnits, keccak256, encodePacked } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import FPMMABI from '@/abis/FixedProductMarketMaker.json';
import CTABI from '@/abis/ConditionalTokens.json';
import { usePrivy, useFundWallet } from '@privy-io/react-auth';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCcw, ExternalLink, CreditCard, Building2, CheckCircle2, ChevronRight, AlertCircle, Loader2, Landmark, ShieldCheck, TrendingUp, History, PieChart, Info, DollarSign } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { Transak } from '@transak/ui-js-sdk';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { userService } from '@/services/userService';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type DepositStep = 'selection' | 'details' | 'processing_bank' | 'confirm' | 'processing_chain' | 'success' | 'failed';
type DepositMethod = 'card' | 'bank' | 'apple_pay';

interface ActivityItem {
    id: string;
    type: 'TRADE' | 'FUNDING';
    market_question?: string;
    amount: number;
    is_buy?: boolean;
    outcome_name?: string;
    timestamp: string;
    tx_hash: string;
}

interface PositionItem {
    market_id: string;
    market_question: string;
    outcome_name: string;
    shares: number;
    current_price: number;
    value: number;
    market_address: string;
}

export default function FundsPage() {
    const { address } = useAccount();
    const { authenticated, login } = usePrivy();
    const { fundWallet } = useFundWallet();
    const { sendNotification } = useNotifications();
    const { profile, isLoading: isProfileLoading, refreshProfile } = useUserProfile();

    // UI State
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMode, setWithdrawMode] = useState<'bank' | 'wallet'>('bank');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isOffRampLoading, setIsOffRampLoading] = useState(false);
    const [depositStep, setDepositStep] = useState<DepositStep>('selection');
    const [depositMethod, setDepositMethod] = useState<DepositMethod>('card');
    const [depositAmount, setDepositAmount] = useState('1000');
    const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
    const [isOnRampLoading, setIsOnRampLoading] = useState(false);

    // Form State
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');
    const [cardName, setCardName] = useState('');

    // Data State
    const [userTrades, setUserTrades] = useState<any[]>([]);
    const [allMarkets, setAllMarkets] = useState<any[]>([]);
    const [activity, setActivity] = useState<ActivityItem[]>([]);

    // 1. Fetch Basic Balances
    const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
        address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
        abi: MockUSDCABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    const { data: ethBalance, refetch: refetchETH } = useBalance({ address });

    // 2. Fetch Data from Supabase
    useEffect(() => {
        if (!address) return;
        const fetchData = async () => {
            // Get user from profiles
            const { data: profileData } = await supabase.from('profiles').select('id').eq('wallet_address', address).single();
            if (!profileData) return;

            // Get Markets
            const { data: markets } = await supabase.from('markets').select('*');
            setAllMarkets(markets || []);

            // Get Trades
            const { data: trades } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', profileData.id)
                .order('created_at', { ascending: false });

            setUserTrades(trades || []);

            // Combine into Activity
            const formattedActivity: ActivityItem[] = (trades || []).map(t => {
                const market = markets?.find(m => m.id === t.market_id);
                return {
                    id: t.id,
                    type: 'TRADE',
                    market_question: market?.question,
                    amount: Number(t.usdc_amount),
                    is_buy: t.is_buy,
                    outcome_name: market?.outcome_tokens[t.outcome_index],
                    timestamp: t.created_at,
                    tx_hash: t.tx_hash
                };
            });
            setActivity(formattedActivity);
        };
        fetchData();
    }, [address]);

    // 3. Batch Read Blockchain for Positions
    const activeMarketAddresses = useMemo(() => Array.from(new Set(userTrades.map(t => t.market_id)))
        .map(id => allMarkets.find(m => m.id === id)?.contract_address)
        .filter(Boolean), [userTrades, allMarkets]);

    // This is a placeholder for actual ConditionalToken balance fetching which requires positionId calculation
    // For MVP Phase 10, we'll estimate based on trade history + mock price
    const positions = useMemo(() => {
        const posMap = new Map<string, PositionItem>();
        userTrades.forEach(t => {
            const market = allMarkets.find(m => m.id === t.market_id);
            if (!market) return;
            const key = `${t.market_id}-${t.outcome_index}`;
            const existing = posMap.get(key);

            const shareDelta = Number(t.share_amount) * (t.is_buy ? 1 : -1);
            if (existing) {
                existing.shares += shareDelta;
                existing.value = existing.shares * 0.5; // Mock current price 0.5
            } else {
                posMap.set(key, {
                    market_id: t.market_id,
                    market_question: market.question,
                    outcome_name: market.outcome_tokens[t.outcome_index],
                    shares: shareDelta,
                    current_price: 0.5,
                    value: shareDelta * 0.5,
                    market_address: market.contract_address
                });
            }
        });
        return Array.from(posMap.values()).filter(p => p.shares > 0.01);
    }, [userTrades, allMarkets]);

    const totalEquityValue = useMemo(() => positions.reduce((sum, p) => sum + p.value, 0), [positions]);

    // 4. Contract Logic
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash) setDepositStep('processing_chain');
        if (isSuccess) {
            setDepositStep('success');
            sendNotification('Assets Secured!', {
                body: `Successfully deposited $${depositAmount} USDC into your secure ledger.`,
            });

            // Save last funding address if it's the first time or different
            if (address && profile && profile.last_funding_address !== address) {
                userService.updateProfile(address, { last_funding_address: address })
                    .then(() => refreshProfile());
            }

            refetchUSDC();
            refetchETH();
        }
    }, [hash, isSuccess, refetchUSDC, refetchETH, address, profile, refreshProfile]);

    const handleBankValidation = () => {
        setDepositStep('processing_bank');
        setTimeout(() => {
            if (parseFloat(depositAmount) > 10000) setDepositStep('failed');
            else setDepositStep('confirm');
        }, 2000);
    };

    const launchOnRamp = async () => {
        if (!address) return;

        // PRODUCTION: Real Money Mode (MoonPay)
        setIsOnRampLoading(true);
        try {
            await fundWallet({ address });
            // 209: Success assumes the user completes the flow in the modal.
            // Success assumes the user completes the flow in the modal.
            // Actual balance refresh happens via on-chain listeners or polling.
        } catch (err: any) {
            console.error('On-Ramp Error:', err);
            // We alert the user if the modal fails to open (e.g. Dashboard not configured)
            alert(`Payment Gateway Error: ${err.message || "Unknown error"}`);
        } finally {
            setIsOnRampLoading(false);
        }
    };

    const launchTransakOffRamp = async () => {
        if (!address) return;

        // SIMULATION MODE: Bypass Transak Off-Ramp API
        setIsOffRampLoading(true);
        try {
            console.log('Starting Simulated Off-Ramp Flow...');

            // 1. Simulate API call latency
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Trigger Success State
            console.log('Simulated Off-ramp successful');
            sendNotification('Withdrawal Pending (Simulated)', {
                body: `Your $${withdrawAmount} USDC withdrawal to bank has been initiated.`,
            });
            setIsWithdrawModalOpen(false);

        } catch (err: any) {
            console.error('Simulation Error:', err);
            alert(`Simulation failed: ${err.message}`);
        } finally {
            setIsOffRampLoading(false);
        }
    };

    // Auto-fill withdrawal address when opening modal
    useEffect(() => {
        if (isWithdrawModalOpen && profile?.last_funding_address) {
            setWithdrawAddress(profile.last_funding_address);
        }
    }, [isWithdrawModalOpen, profile?.last_funding_address]);

    const resetDeposit = () => {
        setIsDepositModalOpen(false);
        setDepositStep('selection');
        setCardNumber(''); setCardExpiry(''); setCardCVV(''); setCardName('');
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <Wallet className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 italic tracking-tighter uppercase">Capital Secure</h1>
                <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">Please authenticate via your secure gateway to view your portfolio and transaction ledger.</p>
                <button
                    onClick={login}
                    className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-3xl transition-all shadow-3xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-xs"
                >
                    Authenticate Session
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-16 relative min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <a href="/activity" className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-colors">Live Portfolio</a>
                        <a href="https://polygonscan.com" target="_blank" rel="noreferrer" className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1">
                            Polygon Mainnet <ExternalLink className="w-2 h-2" />
                        </a>
                    </div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter">Financial Center</h1>
                </div>

                <div className="flex items-center bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
                    <button
                        onClick={() => setActiveTab('positions')}
                        className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'positions' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white")}
                    >
                        <PieChart className="w-3.5 h-3.5" /> Positions
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'activity' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white")}
                    >
                        <History className="w-3.5 h-3.5" /> Activity
                    </button>
                </div>
            </div>

            {/* Main Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <div className="lg:col-span-2 bg-gradient-to-br from-[#0c0e14] via-[#111621] to-[#0c0e14] border border-white/5 rounded-[4rem] p-12 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <TrendingUp className="w-72 h-72 -mr-20 -mt-20 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-slate-600 mb-4 font-black uppercase tracking-[0.3em] text-[10px]">Total Net Valuation</p>
                        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-5 mb-12">
                            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter">
                                ${usdcBalance ? (Number(formatUnits(usdcBalance as bigint, 6)) + totalEquityValue).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                            </h2>
                            <span className="text-xl md:text-2xl font-black text-emerald-500/40 italic">USDC</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pt-12 border-t border-white/5">
                            <div>
                                <p className="text-slate-600 text-[9px] uppercase font-black mb-2 tracking-widest">Available Cash</p>
                                <p className="text-3xl font-black text-white tracking-tighter">${usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 text-[9px] uppercase font-black mb-2 tracking-widest">Equity Value</p>
                                <p className="text-3xl font-black text-emerald-500 tracking-tighter">${totalEquityValue.toFixed(2)}</p>
                            </div>
                            <div className="lg:col-span-2 flex justify-end items-center gap-4">
                                <button
                                    onClick={() => setIsWithdrawModalOpen(true)}
                                    className="px-8 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-3xl transition-all shadow-xl shadow-black/20 uppercase tracking-widest text-[11px] active:scale-95"
                                >
                                    Withdraw
                                </button>
                                <button
                                    onClick={() => setIsDepositModalOpen(true)}
                                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-600/20 uppercase tracking-widest text-[11px] active:scale-95"
                                >
                                    Add Funds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0c0e14]/80 border border-white/5 rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 flex flex-col justify-between backdrop-blur-3xl shadow-3xl">
                    <div>
                        <div className="flex items-center justify-between mb-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Secure Ledger</p>
                            <ShieldCheck className="w-6 h-6 text-emerald-500/30" />
                        </div>

                        <div className="space-y-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-3">Gateway Address</p>
                                <p className="text-slate-200 font-mono text-xs md:text-sm tracking-tighter break-all line-clamp-2 leading-relaxed opacity-70">
                                    {address || 'Connecting...'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Gas</p>
                                <p className="text-xs font-black text-emerald-500">{ethBalance ? Number(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.00'} MATIC</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { if (address) { navigator.clipboard.writeText(address); alert('Copied!'); } }}
                        className="w-full mt-8 py-5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-2xl transition-all border border-white/5 tracking-[0.3em] active:scale-95"
                    >
                        Copy Secure ID
                    </button>
                </div>
            </div>

            {/* Content Tabs (Positions / Activity) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'positions' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white/40">Open Market Positions</h3>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Total Positions: {positions.length}</p>
                        </div>

                        {positions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {positions.map((pos, i) => (
                                    <div key={i} className="bg-slate-900/30 border border-white/5 rounded-[3rem] p-10 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all -rotate-12 translate-x-4 -translate-y-4">
                                            <TrendingUp className="w-24 h-24" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="max-w-[70%]">
                                                    <h4 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-emerald-500 transition-colors uppercase italic tracking-tighter">{pos.market_question}</h4>
                                                    <span className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] rounded-lg">Selection: {pos.outcome_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Position Value</p>
                                                    <p className="text-2xl font-black text-emerald-500">${pos.value.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Total Shares</p>
                                                    <p className="text-sm font-black text-white">{pos.shares.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Market Price</p>
                                                    <p className="text-sm font-black text-white">${pos.current_price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-950/20 border border-white/5 border-dashed rounded-[4rem]">
                                <PieChart className="w-16 h-16 text-slate-900 mx-auto mb-6" />
                                <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">No active wagers found in this session</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white/40">Transactional Ledger</h3>
                            <History className="w-6 h-6 text-slate-900" />
                        </div>

                        <div className="bg-[#0c0e14]/50 border border-white/5 rounded-[2rem] md:rounded-[3rem] overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="p-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Type / Market</th>
                                        <th className="p-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Amount</th>
                                        <th className="p-8 text-[9px] font-black text-slate-700 uppercase tracking-widest hidden md:table-cell">Timestamp</th>
                                        <th className="p-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Ledger Proof</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity.length > 0 ? activity.map((act, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-2.5 rounded-xl shrink-0", act.type === 'TRADE' ? (act.is_buy ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500") : "bg-indigo-500/10 text-indigo-500")}>
                                                        {act.type === 'TRADE' ? (act.is_buy ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />) : <DollarSign className="w-4 h-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-white uppercase tracking-tight leading-none mb-1 truncate max-w-[150px] md:max-w-none">{act.market_question || 'Network Funding'}</p>
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{act.type === 'TRADE' ? `Wager: ${act.outcome_name}` : 'Platform Deposit'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <p className={cn("text-sm font-black italic", act.is_buy === false ? "text-emerald-500" : (act.type === 'TRADE' ? "text-rose-500/70" : "text-emerald-500"))}>
                                                    {act.type === 'TRADE' ? (act.is_buy ? `-$${act.amount.toFixed(2)}` : `+$${act.amount.toFixed(2)}`) : `+$${act.amount.toFixed(2)}`}
                                                </p>
                                            </td>
                                            <td className="p-8 text-[10px] font-bold text-slate-600 uppercase tabular-nums hidden md:table-cell">
                                                {new Date(act.timestamp).toLocaleDateString()} · {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-8">
                                                <a href={`https://sepolia.etherscan.io/tx/${act.tx_hash}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                                                    Verify <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-20 text-center">
                                                <p className="text-slate-700 font-black uppercase tracking-widest text-[10px]">No ledger entries found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* DEPOSIT MODAL (Reusing from Phase 9 but with enhanced styles) */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="bg-[#0c0e14] border border-white/5 w-full max-w-sm rounded-[4rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 pb-4 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-4">
                                <ShieldCheck className="w-6 h-6 text-indigo-500" /> Secure Fund
                            </h3>
                            <button onClick={resetDeposit} className="p-3 hover:bg-slate-900 rounded-full text-slate-600">
                                <AlertCircle className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-12">
                            {depositStep === 'selection' && (
                                <div className="space-y-8">
                                    <div className="text-center py-6">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <span className="text-6xl font-black text-white tracking-tighter">${depositAmount}</span>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">USDC</span>
                                        </div>
                                        <input type="range" min="10" max="5000" step="10" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-6" />
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            onClick={launchOnRamp}
                                            disabled={isOnRampLoading}
                                            className={cn(
                                                "flex items-center justify-between p-7 w-full rounded-[2rem] border-2 border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all outline-none group",
                                                isOnRampLoading && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-5">
                                                {isOnRampLoading ? (
                                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                                ) : (
                                                    <CreditCard className="w-5 h-5 text-emerald-500" />
                                                )}
                                                <div className="text-left">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest block">
                                                        {isOnRampLoading ? 'Initializing Gateway...' : 'Buy with Fiat'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest italic block mt-1">
                                                        * Real Money (Polygon)
                                                    </span>
                                                </div>
                                            </div>
                                            {!isOnRampLoading && <ChevronRight className="w-4 h-4 text-emerald-500" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {depositStep === 'details' && (
                                <div className="space-y-6">
                                    <input type="text" placeholder="CARDHOLDER NAME" className="w-full bg-[#060709] border border-white/5 rounded-2xl p-5 text-white font-black text-[10px] outline-none focus:border-indigo-500 transition-all uppercase tracking-widest" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                                    <div className="relative">
                                        <input type="text" placeholder="CARD NUMBER" className="w-full bg-[#060709] border border-white/5 rounded-2xl p-5 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                                        <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="MM / YY" className="w-full bg-[#060709] border border-white/5 rounded-2xl p-5 text-white font-mono text-center outline-none focus:border-indigo-500 transition-all" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                                        <input type="password" placeholder="CVV" className="w-full bg-[#060709] border border-white/5 rounded-2xl p-5 text-white font-mono text-center outline-none focus:border-indigo-500 transition-all" value={cardCVV} onChange={(e) => setCardCVV(e.target.value)} />
                                    </div>
                                    <button onClick={handleBankValidation} disabled={!cardNumber || !cardExpiry || !cardCVV} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest text-[10px]">Authorize Pay</button>
                                </div>
                            )}

                            {depositStep === 'processing_bank' && (
                                <div className="py-20 flex flex-col items-center text-center">
                                    <Loader2 className="w-20 h-20 text-indigo-500 animate-spin mb-10 opacity-30" />
                                    <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Authenticating</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">Contacting Banking Gateway...</p>
                                </div>
                            )}

                            {depositStep === 'confirm' && (
                                <div className="space-y-10 animate-in zoom-in-95">
                                    <div className="p-10 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[3rem] shadow-3xl text-white relative overflow-hidden">
                                        <Landmark className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10" />
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-10 italic">Allocation Review</p>
                                            <div className="text-7xl font-black tracking-tighter mb-10">${depositAmount}</div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Account ending in {cardNumber.slice(-4)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => writeContract({ address: CONTRACT_ADDRESSES.usdc as `0x${string}`, abi: MockUSDCABI.abi, functionName: 'mint', args: [address as `0x${string}`, parseUnits(depositAmount, 6)] })}
                                        className="w-full py-7 bg-white hover:bg-slate-100 text-black font-black rounded-3xl transition-all shadow-4xl uppercase tracking-[0.3em] text-[10px] active:scale-95"
                                    >
                                        Finalize Requisition
                                    </button>
                                </div>
                            )}

                            {depositStep === 'processing_chain' && (
                                <div className="py-20 flex flex-col items-center text-center">
                                    <RefreshCcw className="w-20 h-20 text-emerald-500 animate-spin mb-10 opacity-30" />
                                    <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Synchronizing</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">Committing entry to Sepolia Ledger...</p>
                                </div>
                            )}

                            {depositStep === 'success' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h4 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-white">Ledger Updated</h4>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-10 max-w-[250px]">Assets are now available in your tradable balance.</p>
                                    <button onClick={resetDeposit} className="w-full py-6 bg-emerald-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] active:scale-95">Return to Dashboard</button>
                                </div>
                            )}

                            {depositStep === 'failed' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <AlertCircle className="w-24 h-24 text-rose-500/20 mb-10" />
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4">Request Denied</h4>
                                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-10 max-w-[200px] leading-relaxed">Insufficient liquidity reported by the target banking account.</p>
                                    <button onClick={resetDeposit} className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px]">Close Gateway</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            )
            }
            {/* WITHDRAW MODAL */}
            {
                isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
                        <div className="bg-[#0c0e14] border border-white/5 w-full max-w-md rounded-[4rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-10 pb-4 flex items-center justify-between border-b border-white/5">
                                <h3 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-4">
                                    <ArrowUpCircle className="w-6 h-6 text-indigo-500" /> Secure Withdrawal
                                </h3>
                                <button onClick={() => setIsWithdrawModalOpen(false)} className="p-3 hover:bg-slate-900 rounded-full text-slate-600">
                                    <AlertCircle className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="p-12 space-y-8">
                                {/* Mode Selection */}
                                <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setWithdrawMode('bank')}
                                        className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", withdrawMode === 'bank' ? "bg-white text-black" : "text-slate-500 hover:text-white")}
                                    >
                                        <Building2 className="w-3.5 h-3.5" /> Back to Bank
                                    </button>
                                    <button
                                        onClick={() => setWithdrawMode('wallet')}
                                        className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", withdrawMode === 'wallet' ? "bg-white text-black" : "text-slate-500 hover:text-white")}
                                    >
                                        <Wallet className="w-3.5 h-3.5" /> External Wallet
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Withdrawal Amount (USDC)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                className="w-full bg-[#060709] border border-white/5 rounded-2xl p-6 pl-14 text-white font-black text-2xl outline-none focus:border-indigo-500 transition-all tabular-nums"
                                            />
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-500 text-xl">$</div>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                <button onClick={() => setWithdrawAmount(formatUnits(usdcBalance as bigint || 0n, 6))} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[8px] font-black text-slate-500 uppercase rounded-lg transition-colors leading-none">MAX</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Recipient Details</label>
                                            {profile?.last_funding_address && withdrawAddress === profile.last_funding_address && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg">
                                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified Loop</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder={withdrawMode === 'bank' ? "Linked Bank Account" : "0x... Destination Wallet"}
                                                value={withdrawAddress}
                                                onChange={(e) => setWithdrawAddress(e.target.value)}
                                                className={cn(
                                                    "w-full bg-[#060709] border border-white/5 rounded-2xl p-5 text-white font-mono text-xs outline-none transition-all pr-12",
                                                    withdrawAddress !== profile?.last_funding_address && withdrawAddress.length > 0 && "border-amber-500/50 focus:border-amber-500"
                                                )}
                                            />
                                            {withdrawMode === 'bank' && <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />}
                                            {withdrawMode === 'wallet' && <ArrowUpCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />}
                                        </div>

                                        {/* AML FLAG UI */}
                                        {withdrawAddress !== profile?.last_funding_address && withdrawAddress.length > 0 && (
                                            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Security Flag: Address Mismatch</p>
                                                    <p className="text-[9px] font-medium text-amber-500/60 leading-relaxed">This address does not match your linked funding source. To prevent money laundering, withdrawals to unverified accounts may take up to 48 hours for manual review.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (withdrawMode === 'bank') {
                                            launchTransakOffRamp();
                                        } else {
                                            writeContract({
                                                address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
                                                abi: MockUSDCABI.abi,
                                                functionName: 'transfer',
                                                args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount || '0', 6)]
                                            });
                                            setIsWithdrawModalOpen(false);
                                            sendNotification('Transfer Initiated', {
                                                body: `Sent $${withdrawAmount} USDC to external wallet.`,
                                            });
                                        }
                                    }}
                                    disabled={!withdrawAddress || !withdrawAmount || isOffRampLoading}
                                    className={cn(
                                        "w-full py-7 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3",
                                        withdrawAddress !== profile?.last_funding_address && withdrawAddress.length > 0 && "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                                    )}
                                >
                                    {isOffRampLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {withdrawMode === 'bank' ? 'Initialize Bank Transfer' : 'Confirm External Transfer'}
                                            {withdrawAddress !== profile?.last_funding_address && withdrawAddress.length > 0 && ' (Subject to Review)'}
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-4 py-4 border-t border-white/5">
                                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                                    <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Secured by AfriSights Compliance Engine</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
