'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuth } from '@/context/AuthContext';
// import { useUserProfile } from '@/hooks/useUserProfile'; // Syncing via AuthContext
// import UserAvatar from '@/components/Avatar'; // Removed as per user request
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
    Copy,
    Globe,
    Map as MapIcon,
    RefreshCcw,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import { QRCodeSVG } from 'qrcode.react';
import { userService } from '@/services/userService';
import { Transak } from '@transak/ui-js-sdk';

type SettingsTab = 'Profile' | 'Account' | 'Trading' | 'Notifications' | 'Builder Codes' | 'Export Private Key';
type DepositStep = 'selection' | 'processing_chain' | 'success' | 'failed' | 'confirm';

export default function SettingsPage() {
    const { user: authUser } = useAuth();
    const { exportWallet } = usePrivy();
    const { wallets } = useWallets();
    const { sendNotification } = useNotifications();
    const { address } = useAccount();

    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    
    // Trading Settings State
    const [tradingSettings, setTradingSettings] = useState({
        marketOrderType: 'FAK',
        showMaxButton: true,
        showLosingPositions: false,
        autoRedeem: false
    });

    const profile = authUser?.profile;
    const smartWallet = wallets.find(w => w.walletClientType === 'privy');

    // --- ACCOUNT TAB STATE ---
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const [depositStep, setDepositStep] = useState<DepositStep>('selection');
    const [depositType, setDepositType] = useState<'fiat' | 'crypto'>('fiat');
    const [depositRegion, setDepositRegion] = useState<'global' | 'africa' | null>(null);
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
        setDepositRegion(null);
    };

    const launchOnRamp = async () => {
        if (!address) return;
        // setIsOnRampLoading(true);
        // try {
        //     await fundWallet({...});
        // } ...
        alert("Global Card payments are temporarily handled via Africa Gateway/Transak. Please use the 'Africa / Mobile Money' option or Transak.");
    };

    const launchTransakDirect = async () => {
        if (!address) return;
        setIsOnRampLoading(true);
        try {
            const transak = new (Transak as any)({
                apiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY || '4f8260b4-106d-472c-8059-e93897b9f71c',
                environment: (process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT as any) || 'STAGING',
                walletAddress: address,
                hostURL: window.location.origin,
                widgetHeight: '700px',
                widgetWidth: '500px',
                cryptoCurrencyCode: 'USDC',
                network: 'polygon',
                defaultCryptoCurrency: 'USDC',
                cryptoCurrencyList: 'USDC',
                fiatAmount: Number(depositAmount),
                email: authUser?.email || '',
                themeColor: '#f59e0b', // Amber for Africa
                exchangeScreenTitle: 'AfriWager Mobile Money',
            });

            transak.init();

            transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
                transak.cleanup();
            });

            transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
                console.log('Order successful!', orderData);
                transak.cleanup();
                setDepositStep('success');
                sendNotification('Payment Received!', {
                    body: "Your transaction is being processed on-chain.",
                });
                refetchUSDC();
            });

        } catch (err: any) {
            console.error('Transak Error:', err);
            alert(`Gateway Error: ${err.message}`);
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
    const displayEmail = authUser?.email || 'madandipiusb@gmail.com';

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
                        <div className="space-y-10 animate-in fade-in duration-300 max-w-2xl">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <User className="w-10 h-10 text-emerald-500" />
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Username</label>
                                    <input 
                                        type="text" 
                                        value={profile?.username || 'Loading...'} 
                                        readOnly
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Email</label>
                                    <input 
                                        type="email" 
                                        value={authUser?.email || 'Not connected'} 
                                        readOnly
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Wallet Address</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={smartWallet?.address || 'Not available'} 
                                            readOnly
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm font-mono focus:outline-none pr-12" 
                                        />
                                        <button 
                                            onClick={() => { if (smartWallet?.address) { navigator.clipboard.writeText(smartWallet.address); sendNotification('Address Copied', { body: 'Copied to clipboard.' }); } }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="mt-3 text-[10px] text-zinc-600 font-medium">Do not send funds directly to this address. Use the deposit modal instead.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Bio</label>
                                    <textarea 
                                        rows={4} 
                                        placeholder="Tell us about yourself" 
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm resize-none focus:outline-none focus:border-white/10 transition-colors" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRADING TAB */}
                    {activeTab === 'Trading' && (
                        <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
                            <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Market Order Type</h4>
                                    <p className="text-xs text-zinc-500 mb-4">Choose how your market orders are executed</p>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="orderType" 
                                                checked={tradingSettings.marketOrderType === 'FAK'}
                                                onChange={() => setTradingSettings(s => ({ ...s, marketOrderType: 'FAK' }))}
                                                className="w-4 h-4 accent-emerald-500" 
                                            />
                                            <div>
                                                <p className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors">Fill and Kill (FAK)</p>
                                                <p className="text-[10px] text-zinc-600">Fills as much as possible and cancels the rest</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="orderType" 
                                                checked={tradingSettings.marketOrderType === 'FOK'}
                                                onChange={() => setTradingSettings(s => ({ ...s, marketOrderType: 'FOK' }))}
                                                className="w-4 h-4 accent-emerald-500" 
                                            />
                                            <div>
                                                <p className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors">Fill or Kill (FOK)</p>
                                                <p className="text-[10px] text-zinc-600">Executes the entire order immediately or cancels it</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Max Button</h4>
                                    <p className="text-xs text-zinc-500">Show a Max button on market buy quick actions</p>
                                </div>
                                <button 
                                    onClick={() => setTradingSettings(s => ({ ...s, showMaxButton: !s.showMaxButton }))}
                                    className={`w-10 h-5 rounded-full transition-all relative ${tradingSettings.showMaxButton ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tradingSettings.showMaxButton ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Losing Positions</h4>
                                    <p className="text-xs text-zinc-500">Show resolved positions where you lost in the tables</p>
                                </div>
                                <button 
                                    onClick={() => setTradingSettings(s => ({ ...s, showLosingPositions: !s.showLosingPositions }))}
                                    className={`w-10 h-5 rounded-full transition-all relative ${tradingSettings.showLosingPositions ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tradingSettings.showLosingPositions ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PRIVATE KEY TAB */}
                    {activeTab === 'Export Private Key' && (
                        <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
                            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-2xl space-y-6">
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Exporting your private key gives you direct control and security over your funds. This is applicable because you signed up via email/social login.
                                </p>
                                
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-red-400 font-medium">
                                        DO NOT share your private key with anyone. We will never ask for your private key. Anyone with this key can steal your funds.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-sm font-semibold text-white">Basic Steps</h4>
                                    <div className="space-y-4">
                                        {[
                                            'Start the process below to initiate secure export.',
                                            'Export your private key and securely store it offline.',
                                            'Never enter this key into untrusted applications.'
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                    {i + 1}
                                                </div>
                                                <p className="text-xs text-zinc-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => exportWallet()}
                                    className="mt-8 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/10"
                                >
                                    Start Export
                                </button>
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
                                            ${authUser?.balance !== undefined ? authUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                        </h2>
                                        <span className="text-xl font-bold text-zinc-600">USDC</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                        <div>
                                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Available Cash</p>
                                            <p className="text-2xl font-bold text-white">${authUser?.balance !== undefined ? authUser.balance.toLocaleString() : '0.00'}</p>
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

                    {/* Placeholders for remaining tabs */}
                    {['Notifications', 'Builder Codes'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] border border-white/5 rounded-2xl">
                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                {activeTab === 'Notifications' && <Bell className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Builder Codes' && <Code className="w-8 h-8 text-zinc-500" />}
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
                                            {!depositRegion ? (
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-4">Choose Your Region</p>
                                                    <button
                                                        onClick={() => setDepositRegion('global')}
                                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left flex items-center gap-4 group"
                                                    >
                                                        <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                                            <Globe className="w-5 h-5 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">Rest of World</p>
                                                            <p className="text-[10px] text-zinc-500">Card / Apple Pay (UK, US, Europe)</p>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setDepositRegion('africa')}
                                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left flex items-center gap-4 group"
                                                    >
                                                        <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                                                            <MapIcon className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-white uppercase tracking-tight">Africa / Mobile Money</p>
                                                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase">No App Required</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-500">M-Pesa, MTN, Airtel & Local Cards</p>
                                                            <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold">Powered by Transak</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            ) : depositRegion === 'global' ? (
                                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                                    <button onClick={() => setDepositRegion(null)} className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1 mb-2">← Change Region</button>
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center gap-2 mb-4">
                                                            <span className="text-2xl font-bold text-white">$</span>
                                                            <input
                                                                type="number"
                                                                value={depositAmount}
                                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                                className="text-4xl font-black text-white bg-transparent border-b border-emerald-500/50 outline-none w-32 text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button onClick={launchOnRamp} disabled={isOnRampLoading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                        {isOnRampLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                        {isOnRampLoading ? 'Initializing...' : 'Pay with Card'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                                    <button onClick={() => setDepositRegion(null)} className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1 mb-2">← Change Region</button>

                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center gap-2 mb-4">
                                                            <span className="text-2xl font-bold text-white">$</span>
                                                            <input
                                                                type="number"
                                                                value={depositAmount}
                                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                                className="text-4xl font-black text-white bg-transparent border-b border-amber-500/50 outline-none w-32 text-center"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                                <MapIcon className="w-5 h-5 text-amber-500" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-xs font-bold text-white uppercase tracking-tight">Africa Gateway</p>
                                                                <p className="text-[10px] text-amber-500/60 uppercase font-bold">Mobile Money & Local Cards</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={launchTransakDirect}
                                                            disabled={isOnRampLoading}
                                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
                                                        >
                                                            {isOnRampLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCcw className="w-4 h-4" />}
                                                            {isOnRampLoading ? 'Initializing...' : 'Deposit via Mobile Money'}
                                                        </button>

                                                        <p className="text-[9px] text-zinc-600 uppercase font-black">Supports MTN, Airtel, and M-Pesa</p>
                                                    </div>
                                                </div>
                                            )}
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
