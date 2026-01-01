'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useFundWallet } from '@privy-io/react-auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserAvatar from '@/components/Avatar';
import {
    User,
    Wallet,
    BarChart2,
    Bell,
    Code,
    Key,
    Upload,
    Loader2,
    CreditCard,
    ShieldCheck,
    AlertCircle,
    ArrowUpCircle,
    Copy
} from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import { QRCodeSVG } from 'qrcode.react';
import { useNotifications } from '@/hooks/useNotifications';
import { userService } from '@/services/userService';

type SettingsTab = 'Profile' | 'Account' | 'Trading' | 'Notifications' | 'Builder Codes' | 'Export Private Key';
type DepositStep = 'selection' | 'processing_chain' | 'success' | 'failed' | 'confirm';

export default function SettingsPage() {
    // Auth & Profile
    const { user } = usePrivy();
    const { profile, refreshProfile } = useUserProfile();
    const { fundWallet } = useFundWallet();
    const { sendNotification } = useNotifications();
    const { address } = useAccount();

    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');

    // --- ACCOUNT TAB STATE ---
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const [depositStep, setDepositStep] = useState<DepositStep>('selection');
    const [depositType, setDepositType] = useState<'fiat' | 'crypto'>('fiat');
    const [depositAmount, setDepositAmount] = useState('1000');
    const [isOnRampLoading, setIsOnRampLoading] = useState(false);

    // --- DATA FETCHING ---
    const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
        address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
        abi: MockUSDCABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    const { data: ethBalance, refetch: refetchETH } = useBalance({ address });

    // Contract Writes
    const { writeContract, data: hash } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    // --- EFFECTS ---
    useEffect(() => {
        if (hash) setDepositStep('processing_chain');
        if (isSuccess) {
            setDepositStep('success');
            sendNotification('Assets Secured!', {
                body: `Successfully deposited $${depositAmount} USDC into your secure ledger.`,
            });
            if (address && profile && profile.last_funding_address !== address) {
                userService.updateProfile(address, { last_funding_address: address })
                    .then(() => refreshProfile());
            }
            refetchUSDC();
            refetchETH();
        }
    }, [hash, isSuccess, refetchUSDC, refetchETH, address, profile, refreshProfile, depositAmount, sendNotification]);

    useEffect(() => {
        if (isWithdrawModalOpen && profile?.last_funding_address) {
            setWithdrawAddress(profile.last_funding_address);
        }
    }, [isWithdrawModalOpen, profile?.last_funding_address]);

    // --- HANDLERS ---
    const resetDeposit = () => {
        setIsDepositModalOpen(false);
        setDepositStep('selection');
    };

    const launchOnRamp = async () => {
        if (!address) return;
        setIsOnRampLoading(true);
        try {
            await fundWallet(address, {
                chain: { id: 137, name: 'Polygon', rpcUrls: { default: { http: ['https://polygon-rpc.com'] } }, nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
                fundingMethodConfig: {
                    moonpay: {
                        useSandbox: false,
                        quoteCurrencyCode: 'USDC',
                        defaultCurrencyCode: 'USDC_POLYGON',
                        paymentMethod: 'credit_debit_card'
                    }
                }
            });
        } catch (err: any) {
            console.error('On-Ramp Error:', err);
            alert(`Payment Gateway Error: ${err.message || "Unknown error"}`);
        } finally {
            setIsOnRampLoading(false);
        }
    };

    // Sidebar Config
    const sidebarItems: { name: SettingsTab; icon: any }[] = [
        { name: 'Profile', icon: User },
        { name: 'Account', icon: Wallet },
        { name: 'Trading', icon: BarChart2 },
        { name: 'Notifications', icon: Bell },
        { name: 'Builder Codes', icon: Code },
        { name: 'Export Private Key', icon: Key },
    ];

    const displayUsername = profile?.username || 'User';
    const displayEmail = user?.email?.address || 'madandipiusb@gmail.com';

    return (
        <div className="min-h-screen bg-black text-white pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Sidebar */}
                <div className="md:col-span-1">
                    <nav className="flex flex-col space-y-1 sticky top-24">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.name
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${activeTab === item.name ? 'text-emerald-400' : ''}`} />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <h1 className="text-2xl font-bold mb-8">{activeTab === 'Profile' ? 'Profile Settings' : `${activeTab} Settings`}</h1>

                    {/* PROFILE TAB */}
                    {activeTab === 'Profile' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex items-center gap-6">
                                <UserAvatar
                                    name={profile?.avatar_seed || address || 'user'}
                                    size={80}
                                    className="ring-4 ring-[#1C1C1E]"
                                />
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#2C2C2E] transition-colors">
                                    <Upload className="w-4 h-4 text-zinc-400" />
                                    Upload
                                </button>
                            </div>
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                                    <input type="email" value={displayEmail} disabled className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
                                    <input type="text" defaultValue={displayUsername} className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                    <p className="mt-2 text-xs text-zinc-500 font-mono">{address}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                                    <textarea rows={4} placeholder="Tell us about yourself" defaultValue="Bio" className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                </div>
                                <div className="pt-4">
                                    <button className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACCOUNT TAB */}
                    {activeTab === 'Account' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-[#0c0e14] via-[#111621] to-[#0c0e14] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Net Valuation</p>
                                    <div className="flex items-baseline gap-2 mb-8">
                                        <h2 className="text-5xl font-black text-white tracking-tighter">
                                            ${usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                        </h2>
                                        <span className="text-xl font-bold text-zinc-600">USDC</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                        <div>
                                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Available Cash</p>
                                            <p className="text-2xl font-bold text-white">${usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Network Gas</p>
                                            <p className="text-2xl font-bold text-emerald-500">{ethBalance ? Number(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.00'} <span className="text-sm text-emerald-500/50">MATIC</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={() => setIsDepositModalOpen(true)}
                                            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                                        >
                                            Add Funds
                                        </button>
                                        <button
                                            onClick={() => setIsWithdrawModalOpen(true)}
                                            className="px-8 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Info */}
                            <div className="bg-[#0c0e14] border border-white/5 rounded-3xl p-8">
                                <h3 className="text-lg font-bold text-white mb-4">Linked Wallet</h3>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 font-mono mb-1">Wallet Address</p>
                                        <p className="text-sm text-white font-mono break-all">{address || 'Connecting...'}</p>
                                    </div>
                                    <button
                                        onClick={() => { if (address) { navigator.clipboard.writeText(address); alert('Copied!'); } }}
                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholders */}
                    {['Trading', 'Notifications', 'Builder Codes', 'Export Private Key'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] border border-white/5 rounded-2xl">
                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                {activeTab === 'Trading' && <BarChart2 className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Notifications' && <Bell className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Builder Codes' && <Code className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Export Private Key' && <Key className="w-8 h-8 text-zinc-500" />}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{activeTab}</h3>
                            <p className="text-zinc-500 text-sm">This section is coming soon.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* DEPOSIT MODAL */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Add Funds</h3>
                            <button onClick={resetDeposit} className="text-zinc-400 hover:text-white"><AlertCircle className="w-6 h-6 rotate-45" /></button>
                        </div>
                        <div className="p-6">
                            {depositStep === 'selection' && (
                                <div className="space-y-6">
                                    <div className="flex bg-black/30 p-1 rounded-xl">
                                        <button onClick={() => setDepositType('fiat')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${depositType === 'fiat' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Card / Apple Pay</button>
                                        <button onClick={() => setDepositType('crypto')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${depositType === 'crypto' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Crypto Transfer</button>
                                    </div>

                                    {depositType === 'fiat' ? (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <p className="text-4xl font-black text-white mb-2">${depositAmount}</p>
                                                <input type="range" min="10" max="5000" step="10" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                            </div>
                                            <button onClick={launchOnRamp} disabled={isOnRampLoading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                {isOnRampLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                {isOnRampLoading ? 'Initializing...' : 'Pay with Card'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="bg-white p-4 rounded-xl inline-block"><QRCodeSVG value={address || ''} size={150} /></div>
                                            <p className="font-mono text-xs text-zinc-400 bg-black/50 p-3 rounded-lg break-all">{address}</p>
                                            <p className="text-xs text-emerald-500">Send USDC (Polygon) only.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Short-circuit other steps for MVP Settings Page, mainly relying on MoonPay modal or On-Chain Logic */}
                        </div>
                    </div>
                </div>
            )}

            {/* WITHDRAW MODAL */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-indigo-500" /> Withdraw</h3>
                            <button onClick={() => setIsWithdrawModalOpen(false)} className="text-zinc-400 hover:text-white"><AlertCircle className="w-6 h-6 rotate-45" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Amount (USDC)</label>
                                <div className="relative">
                                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all" placeholder="0.00" />
                                    <button onClick={() => setWithdrawAmount(formatUnits(usdcBalance as bigint || 0n, 6))} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-zinc-400 hover:text-white">MAX</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Destination Address</label>
                                <input type="text" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm font-mono outline-none focus:border-indigo-500 transition-all" placeholder="0x..." />
                            </div>
                            <button
                                onClick={() => {
                                    writeContract({
                                        address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
                                        abi: MockUSDCABI.abi,
                                        functionName: 'transfer',
                                        args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount || '0', 6)]
                                    });
                                    setIsWithdrawModalOpen(false);
                                    sendNotification('Transfer Initiated', { body: `Sent $${withdrawAmount} USDC.` });
                                }}
                                disabled={!withdrawAmount || !withdrawAddress}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                Confirm Withdrawal
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
