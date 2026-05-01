'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuth } from '@/context/AuthContext';
import {
    User,
    Wallet,
    BarChart2,
    Bell,
    Code,
    Key,
    Copy,
    AlertCircle,
    ArrowUpCircle,
    Globe,
    ShieldCheck
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

type SettingsTab = 'Profile' | 'Account' | 'Trading' | 'Notifications' | 'Builder Codes' | 'Export Private Key';

export default function SettingsPage() {
    const { user: authUser } = useAuth();
    const { exportWallet } = usePrivy();
    const { wallets } = useWallets();
    const { sendNotification } = useNotifications();
    const { address } = useAccount();
    const { data: ethBalance } = useBalance({ address });

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
    const displayUsername = profile?.username || (authUser ? 'Loading...' : 'Guest');
    const displayEmail = authUser?.email || 'Not connected';

    // Sidebar Config
    const sidebarItems: { name: SettingsTab; icon: any }[] = [
        { name: 'Profile', icon: User },
        { name: 'Account', icon: Wallet },
        { name: 'Trading', icon: BarChart2 },
        { name: 'Notifications', icon: Bell },
        { name: 'Builder Codes', icon: Code },
        { name: 'Export Private Key', icon: Key },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        sendNotification('Copied', { body: 'Copied to clipboard' });
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">

                {/* Sidebar */}
                <div className="md:col-span-1">
                    <nav className="flex flex-col space-y-1 sticky top-28">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    activeTab === item.name
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                                }`}
                            >
                                <item.icon className={`w-4 h-4 ${activeTab === item.name ? 'text-emerald-500' : ''}`} />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 min-h-[600px]">
                    <h1 className="text-2xl font-bold mb-10 text-white">
                        {activeTab === 'Export Private Key' ? 'Private Key' : activeTab}
                    </h1>

                    {/* PROFILE TAB */}
                    {activeTab === 'Profile' && (
                        <div className="space-y-10 animate-in fade-in duration-300 max-w-2xl">
                            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <User className="w-12 h-12 text-emerald-500" />
                            </div>
                            
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Username</label>
                                    <input 
                                        type="text" 
                                        value={displayUsername} 
                                        readOnly
                                        className="w-full bg-[#0c0e14] border border-white/5 rounded-xl px-4 py-4 text-white text-sm focus:outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Email</label>
                                    <input 
                                        type="email" 
                                        value={displayEmail} 
                                        readOnly
                                        className="w-full bg-[#0c0e14] border border-white/5 rounded-xl px-4 py-4 text-white text-sm focus:outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Address</label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={smartWallet?.address || 'Connecting...'} 
                                            readOnly
                                            className="w-full bg-[#0c0e14] border border-white/5 rounded-xl px-4 py-4 text-white text-sm font-mono focus:outline-none pr-12" 
                                        />
                                        <button 
                                            onClick={() => smartWallet?.address && copyToClipboard(smartWallet.address)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="mt-3 text-[10px] text-zinc-600 font-medium leading-relaxed">
                                        Do not send funds to this address. This address is for API use only.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Bio</label>
                                    <textarea 
                                        rows={4} 
                                        placeholder="Bio" 
                                        className="w-full bg-[#0c0e14] border border-white/5 rounded-xl px-4 py-4 text-white text-sm resize-none focus:outline-none focus:border-white/10 transition-colors" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACCOUNT TAB */}
                    {activeTab === 'Account' && (
                        <div className="space-y-10 animate-in fade-in duration-300 max-w-3xl">
                            <div className="bg-[#0c0e14] border border-white/5 rounded-3xl p-8">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Total Net Valuation</p>
                                <div className="flex items-baseline gap-3 mb-10">
                                    <h2 className="text-5xl font-black text-white tracking-tighter">
                                        ${authUser?.balance !== undefined ? authUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                    </h2>
                                    <span className="text-xl font-bold text-zinc-600 uppercase">USDC</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                                    <div>
                                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Available Cash</p>
                                        <p className="text-3xl font-bold text-white">
                                            ${authUser?.balance !== undefined ? authUser.balance.toLocaleString() : '0'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-12">
                                    <button className="px-10 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm">
                                        Add Funds
                                    </button>
                                    <button className="px-10 py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 border border-white/5 transition-all text-sm">
                                        Withdraw
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#0c0e14] border border-white/5 rounded-3xl p-8">
                                <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Linked Wallet</h3>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Wallet Address</p>
                                        <p className="text-sm text-zinc-300 font-mono">{smartWallet?.address || 'Connecting...'}</p>
                                    </div>
                                    <button 
                                        onClick={() => smartWallet?.address && copyToClipboard(smartWallet.address)}
                                        className="p-3 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRADING TAB */}
                    {activeTab === 'Trading' && (
                        <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
                            <h2 className="text-xl font-bold text-white mb-6">Trading Settings</h2>
                            
                            <div className="p-8 bg-[#0c0e14] border border-white/5 rounded-2xl space-y-8">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Market Order Type</h4>
                                    <p className="text-xs text-zinc-500 mb-6">Choose how your market orders are executed</p>
                                    
                                    <div className="space-y-6">
                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="orderType" 
                                                checked={tradingSettings.marketOrderType === 'FAK'}
                                                onChange={() => setTradingSettings(s => ({ ...s, marketOrderType: 'FAK' }))}
                                                className="mt-1 w-4 h-4 accent-emerald-500" 
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">Fill and Kill (FAK)</p>
                                                <p className="text-xs text-zinc-500 mt-1">Fills as much as possible at the best available prices and cancels any remaining unfilled portion</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="orderType" 
                                                checked={tradingSettings.marketOrderType === 'FOK'}
                                                onChange={() => setTradingSettings(s => ({ ...s, marketOrderType: 'FOK' }))}
                                                className="mt-1 w-4 h-4 accent-emerald-500" 
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">Fill or Kill (FOK)</p>
                                                <p className="text-xs text-zinc-500 mt-1">Executes the entire order immediately at the specified price or cancels it completely</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-[#0c0e14] border border-white/5 rounded-2xl space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-1">Max Button</h4>
                                        <p className="text-xs text-zinc-500">Shows a Max button on market and limit buy quick actions that fills your full balance with one tap</p>
                                    </div>
                                    <button 
                                        onClick={() => setTradingSettings(s => ({ ...s, showMaxButton: !s.showMaxButton }))}
                                        className={`w-12 h-6 rounded-full transition-all relative ${tradingSettings.showMaxButton ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tradingSettings.showMaxButton ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                
                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-1">Show Max button on buys</h4>
                                    </div>
                                    <button className="w-12 h-6 rounded-full bg-emerald-500 relative">
                                        <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 bg-[#0c0e14] border border-white/5 rounded-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-1">Losing Positions</h4>
                                        <p className="text-xs text-zinc-500">Show resolved positions where you lost in the Portfolio and Profile positions tables. Hidden by default.</p>
                                    </div>
                                    <button 
                                        onClick={() => setTradingSettings(s => ({ ...s, showLosingPositions: !s.showLosingPositions }))}
                                        className={`w-12 h-6 rounded-full transition-all relative ${tradingSettings.showLosingPositions ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tradingSettings.showLosingPositions ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BUILDER CODES */}
                    {activeTab === 'Builder Codes' && (
                        <div className="animate-in fade-in duration-300 max-w-2xl">
                             <div className="p-8 bg-[#0c0e14] border border-white/5 rounded-2xl flex items-center gap-4">
                                <Code className="w-6 h-6 text-emerald-500" />
                                <div>
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Builder Codes</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Institutional developer tools and API access</p>
                                </div>
                             </div>
                             <div className="mt-8 flex flex-col items-center justify-center py-20 bg-[#0c0e14]/50 border border-white/5 border-dashed rounded-2xl">
                                <Code className="w-10 h-10 text-zinc-700 mb-4" />
                                <p className="text-zinc-500 text-sm font-medium tracking-tight">Access restricted to verified institutional partners.</p>
                             </div>
                        </div>
                    )}

                    {/* PRIVATE KEY TAB */}
                    {activeTab === 'Export Private Key' && (
                        <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
                            <div className="p-10 bg-[#0c0e14] border border-white/5 rounded-3xl space-y-8">
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Exporting your private key gives you direct control and security over your funds. This is applicable if you've signed up via email.
                                </p>
                                
                                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-400 font-semibold leading-relaxed">
                                        DO NOT share your private key with anyone. We will never ask for your private key. Anyone with this key can steal your funds.
                                    </p>
                                </div>

                                <div className="space-y-6 pt-6">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Basic Steps</h4>
                                    <div className="space-y-6">
                                        {[
                                            'Start the process below to initiate secure export.',
                                            'Export your private key and securely store the private key displayed.',
                                            'Never enter this key into untrusted applications.'
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-center gap-6 group">
                                                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:border-emerald-500/50 transition-all">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-zinc-300 font-medium">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => exportWallet()}
                                    className="mt-10 px-12 py-4 bg-red-600 hover:bg-red-500 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-red-600/20"
                                >
                                    Start Export
                                </button>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS Placeholder */}
                    {activeTab === 'Notifications' && (
                        <div className="flex flex-col items-center justify-center py-32 bg-[#0c0e14] border border-white/5 rounded-3xl animate-in fade-in duration-300">
                            <Bell className="w-12 h-12 text-zinc-700 mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Notifications</h3>
                            <p className="text-zinc-600 text-sm font-medium">Configure your alerts and market updates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
