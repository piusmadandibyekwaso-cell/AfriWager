'use client';

import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import { useAuth } from '@/context/AuthContext';
import {
    Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCcw, ExternalLink, CreditCard,
    Building2, CheckCircle2, ChevronRight, AlertCircle, Loader2, Landmark,
    ShieldCheck, TrendingUp, History as HistoryIcon, PieChart, Info, DollarSign, Copy, Globe, Map as MapIcon
} from 'lucide-react';
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
    const { user: authUser, openAuthModal } = useAuth();
    const { sendNotification } = useNotifications();
    const { profile, refreshProfile } = useUserProfile();

    // UI State
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMode, setWithdrawMode] = useState<'bank' | 'wallet'>('bank');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isOffRampLoading, setIsOffRampLoading] = useState(false);
    const [depositStep, setDepositStep] = useState<DepositStep>('selection');
    const [depositType, setDepositType] = useState<'fiat' | 'crypto'>('fiat');
    const [depositAmount, setDepositAmount] = useState('1000');
    const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
    const [isOnRampLoading, setIsOnRampLoading] = useState(false);
    const [depositRegion, setDepositRegion] = useState<'global' | 'africa' | null>(null);

    // Form State
    const [txHash, setTxHash] = useState('');

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
            const { data: profileData } = await supabase.from('profiles').select('id').eq('wallet_address', address).single();
            if (!profileData) return;

            const { data: markets } = await supabase.from('markets').select('*');
            setAllMarkets(markets || []);

            const { data: trades } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', profileData.id)
                .order('created_at', { ascending: false });

            setUserTrades(trades || []);

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

    // 3. Positions Calculation
    const positions = useMemo<PositionItem[]>(() => {
        const posMap = new Map<string, PositionItem>();
        userTrades.forEach(t => {
            const market = allMarkets.find(m => m.id === t.market_id);
            if (!market) return;
            const key = `${t.market_id}-${t.outcome_index}`;
            const existing = posMap.get(key);

            const shareDelta = Number(t.share_amount) * (t.is_buy ? 1 : -1);
            if (existing) {
                existing.shares += shareDelta;
                existing.value = existing.shares * 0.5;
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

    const totalEquityValue = useMemo<number>(() => positions.reduce((sum, p) => sum + p.value, 0), [positions]);

    // 4. Contract Logic
    const { writeContract, data: hash } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash) setDepositStep('processing_chain');
        if (isSuccess) {
            setDepositStep('success');
            sendNotification('Assets Secured!', {
                body: `Successfully deposited $${depositAmount} USDC.`,
            });
            if (address && profile && profile.last_funding_address !== address) {
                userService.updateProfile(address, { last_funding_address: address })
                    .then(() => refreshProfile());
            }
            refetchUSDC();
            refetchETH();
        }
    }, [hash, isSuccess, refetchUSDC, refetchETH, address, profile, refreshProfile, depositAmount, sendNotification]);

    const handleBankValidation = () => {
        setDepositStep('processing_bank');
        setTimeout(() => {
            if (parseFloat(depositAmount) > 100000) setDepositStep('failed');
            else setDepositStep('confirm');
        }, 2000);
    };

    const handleBlockchainDeposit = async () => {
        if (!txHash) return;
        setDepositStep('processing_chain');
        try {
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'DEPOSIT',
                    txHash: txHash
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ledger update failed');
            }

            const data = await response.json();

            setDepositStep('success');
            sendNotification('Capital Inbound!', {
                body: `Successfully verified and credited $${data.depositedAmount} USDC into your ledger.`,
            });
            refreshProfile();
        } catch (error) {
            console.error('Deposit simulation failed:', error);
            setDepositStep('failed');
        }
    };

    const launchOnRamp = async () => {
        alert("Global Card payments are temporarily handled via Africa Gateway/Transak. Please use the 'Direct Transfer' or 'Africa Local' option.");
    };

    const launchTransakOffRamp = async () => {
        if (!address) return;
        setIsOffRampLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            sendNotification('Withdrawal Pending (Simulated)', {
                body: `Your $${withdrawAmount} USDC withdrawal to bank has been initiated.`,
            });
            setIsWithdrawModalOpen(false);
        } finally {
            setIsOffRampLoading(false);
        }
    };

    const resetDeposit = () => {
        setIsDepositModalOpen(false);
        setDepositStep('selection');
        setDepositRegion(null);
        setDepositRegion(null);
        setTxHash('');
    };

    if (!authUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <Wallet className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 italic tracking-tighter uppercase">Capital Secure</h1>
                <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">Please authenticate via your secure gateway to view your portfolio.</p>
                <button onClick={openAuthModal} className="px-12 py-5 bg-emerald-500 text-black font-black rounded-3xl transition-all shadow-3xl uppercase tracking-widest text-xs">Authenticate Session</button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-16 relative min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                <div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter">Financial Center</h1>
                </div>
                <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
                    <button onClick={() => setActiveTab('positions')} className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'positions' ? "bg-emerald-500 text-black" : "text-slate-500 hover:text-white")}><PieChart className="w-3.5 h-3.5" /> Positions</button>
                    <button onClick={() => setActiveTab('activity')} className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'activity' ? "bg-emerald-500 text-black" : "text-slate-500 hover:text-white")}><HistoryIcon className="w-3.5 h-3.5" /> Activity</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <div className="lg:col-span-2 bg-gradient-to-br from-[#0c0e14] via-[#111621] to-[#0c0e14] border border-white/5 rounded-[4rem] p-12 shadow-3xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-slate-600 mb-4 font-black uppercase tracking-[0.3em] text-[10px]">Total Net Valuation</p>
                        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-5 mb-12">
                            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter">
                                ${(authUser?.balance !== undefined ? (authUser.balance + totalEquityValue) : totalEquityValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-xl md:text-2xl font-black text-emerald-500/40 italic">USDC</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pt-12 border-t border-white/5">
                            <div>
                                <p className="text-slate-600 text-[9px] uppercase font-black mb-2 tracking-widest">Available Cash</p>
                                <p className="text-3xl font-black text-white tracking-tighter">${authUser?.balance !== undefined ? authUser.balance.toLocaleString() : '0.00'}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 text-[9px] uppercase font-black mb-2 tracking-widest">Equity Value</p>
                                <p className="text-3xl font-black text-emerald-500 tracking-tighter">${totalEquityValue.toFixed(2)}</p>
                            </div>
                            <div className="lg:col-span-2 flex justify-end items-center gap-4">
                                <button onClick={() => { setWithdrawAddress(profile?.last_funding_address || ''); setIsWithdrawModalOpen(true); }} className="px-8 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-3xl transition-all uppercase tracking-widest text-[11px]">Withdraw</button>
                                <button onClick={() => setIsDepositModalOpen(true)} className="px-10 py-5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-3xl transition-all uppercase tracking-widest text-[11px]">Add Funds</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0c0e14]/80 border border-white/5 rounded-[4rem] p-12 flex flex-col justify-between backdrop-blur-3xl shadow-3xl">
                    <div>
                        <div className="flex items-center justify-between mb-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Secure Ledger</p>
                            <ShieldCheck className="w-6 h-6 text-emerald-500/30" />
                        </div>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-3">Gateway Address</p>
                                <p className="text-slate-200 font-mono text-xs break-all leading-relaxed opacity-70">{address || 'Connecting...'}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => { if (address) { navigator.clipboard.writeText(address); alert('Copied!'); } }} className="w-full mt-8 py-5 bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase rounded-2xl border border-white/5">Copy Secure ID</button>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'positions' ? (
                   <div className="space-y-6">
                        {positions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {positions.map((pos, i) => (
                                    <div key={i} className="bg-slate-900/30 border border-white/5 rounded-[3rem] p-10 hover:border-emerald-500/30 transition-all group overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="max-w-[70%]">
                                                    <h4 className="text-lg font-black text-white leading-tight mb-2 uppercase italic tracking-tighter">{pos.market_question}</h4>
                                                    <span className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-500 uppercase rounded-lg">{pos.outcome_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-500">${pos.value.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-950/20 border border-white/5 border-dashed rounded-[4rem]">
                                <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">No active wagers found</p>
                            </div>
                        )}
                   </div>
                ) : (
                    <div className="bg-[#0c0e14]/50 border border-white/5 rounded-[3rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5"><th className="p-8 text-[9px] font-black text-slate-700 uppercase">Market</th><th className="p-8 text-[9px] font-black text-slate-700 uppercase">Amount</th></tr>
                            </thead>
                            <tbody>
                                {activity.map((act, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="p-8 text-xs font-black text-white uppercase">{act.market_question || 'Deposit'}</td>
                                        <td className="p-8 text-sm font-black text-emerald-500">${act.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isDepositModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
                    <div className="bg-[#0c0e14] border border-white/5 w-full max-w-sm rounded-[4rem] overflow-hidden">
                        <div className="p-10 pb-4 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-xl font-black tracking-tighter uppercase italic">Secure Fund</h3>
                            <button onClick={resetDeposit} className="p-3 text-slate-600 hover:text-white"><AlertCircle /></button>
                        </div>
                        <div className="p-12">
                            {depositStep === 'selection' && (
                                <div className="space-y-8">
                                    <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                                        <button onClick={() => setDepositType('fiat')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase", depositType === 'fiat' ? "bg-white text-black" : "text-slate-500")}>Mobile Money / Card</button>
                                        <button onClick={() => setDepositType('crypto')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase", depositType === 'crypto' ? "bg-white text-black" : "text-slate-500")}>Blockchain</button>
                                    </div>
                                    {depositType === 'fiat' ? (
                                        <div className="text-center space-y-6">
                                            <Building2 className="w-16 h-16 text-slate-700 mx-auto" />
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed">Fiat deposit gateways (Mobile Money & Card) are currently undergoing integration via Yellow Card.</p>
                                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Coming Soon</p>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-6">
                                            <div className="bg-white p-4 rounded-3xl inline-block mx-auto"><QRCodeSVG value={CONTRACT_ADDRESSES.treasury} size={150} /></div>
                                            <div className="space-y-1">
                                                <p className="text-[14px] font-black text-white uppercase tracking-tighter italic">AfriWager Treasury</p>
                                                <p className="text-[9px] font-medium text-slate-500 uppercase break-all">{CONTRACT_ADDRESSES.treasury}</p>
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">Send USDC (Polygon) to the Treasury address above, then paste the Transaction Hash below to verify.</p>
                                            <input type="text" placeholder="Transaction Hash (TxID)" value={txHash} onChange={e => setTxHash(e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white font-mono text-xs" />
                                            <button onClick={handleBlockchainDeposit} disabled={!txHash} className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">Verify Deposit</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {depositStep === 'processing_chain' && <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-emerald-500" /><p className="mt-4 uppercase font-black text-xs">Synchronizing...</p></div>}
                            {depositStep === 'success' && <div className="py-20 text-center"><CheckCircle2 className="mx-auto w-16 h-16 text-emerald-500" /><h4 className="mt-4 text-xl font-black uppercase">Confirmed</h4><button onClick={resetDeposit} className="mt-8 w-full py-6 bg-emerald-500 text-black font-black rounded-2xl">Finish</button></div>}
                            {depositStep === 'failed' && <div className="py-20 text-center"><AlertCircle className="mx-auto w-16 h-16 text-rose-500" /><h4 className="mt-4 text-xl font-black uppercase">Failed</h4><button onClick={resetDeposit} className="mt-8 w-full py-6 bg-slate-900 text-white font-black rounded-2xl">Close</button></div>}
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
                    <div className="bg-[#0c0e14] border border-white/5 w-full max-w-md rounded-[4rem] overflow-hidden">
                        <div className="p-10 pb-4 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-xl font-black tracking-tighter uppercase italic">Secure Withdrawal</h3>
                            <button onClick={() => setIsWithdrawModalOpen(false)} className="p-3 text-slate-600 hover:text-white"><AlertCircle /></button>
                        </div>
                        <div className="p-12 space-y-8">
                            <div className="space-y-6">
                                <p className="text-[11px] font-medium text-slate-400">If using Binance, ensure this is your exact <strong>Polygon USDC Deposit Address</strong>. Your initial funding source has been pre-filled.</p>
                                <input type="number" placeholder="Amount (USDC)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-black border border-white/5 p-6 rounded-2xl text-white font-black text-2xl" />
                                <input type="text" placeholder="Binance Deposit Address (0x...)" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-amber-500 font-mono text-xs" />
                                <button onClick={launchTransakOffRamp} className="w-full py-7 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest text-[10px]">Initialize Transfer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
