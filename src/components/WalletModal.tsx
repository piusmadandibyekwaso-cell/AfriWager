
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, X, Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { user } = useAuth();
    const { sendNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [txHash, setTxHash] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currency, setCurrency] = useState<'USD' | 'UGX'>('USD');
    const exchangeRate = 3850; // 1 USD = 3850 UGX

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (activeTab === 'deposit') {
            // Deposits are now handled automatically via blockchain indexer
            sendNotification('Listening for Deposits', {
                body: `We are monitoring your unique address on the Polygon network. Your balance will update automatically when funds arrive.`
            });
            onClose();
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert UGX back to USD for API
            const amountUSD = currency === 'USD' ? parseFloat(amount || '0') : parseFloat(amount || '0') / exchangeRate;

            const payload = { type: 'WITHDRAW', amountUSD, withdrawAddress: withdrawAddress.trim() };

            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            sendNotification('Withdrawal Processed', {
                body: `Sent ${currency === 'USD' ? '$' : 'USh '}${amount} to ${withdrawAddress.slice(0, 6)}...`,
            });
            onClose();
            window.location.reload(); // Refresh balance
        } catch (error: any) {
            console.error('Wallet error:', error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0c0e12] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5 text-zinc-400" />
                </button>

                <div className="p-8">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-emerald-500" /> AfriVault
                        </h2>
                        {/* Institutional Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Safe{'{Core}'} SDK</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6 ml-1">Institutional-Grade Custody</p>

                    {/* Balance Display */}
                    <div className="bg-zinc-900/50 rounded-2xl p-6 mb-8 text-center border border-white/5 relative group">
                        <div className="absolute top-4 right-4 flex bg-black rounded-lg p-1 border border-zinc-800">
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-3 py-1 text-[10px] font-black rounded transition-all ${currency === 'USD' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                            >
                                USD
                            </button>
                            <button
                                onClick={() => setCurrency('UGX')}
                                className={`px-3 py-1 text-[10px] font-black rounded transition-all ${currency === 'UGX' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                            >
                                UGX
                            </button>
                        </div>

                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Available Balance</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">
                            {currency === 'USD'
                                ? `$${user?.balance?.toFixed(2) || '0.00'}`
                                : `USh ${((user?.balance || 0) * exchangeRate).toLocaleString()}`
                            }
                        </h3>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-zinc-900 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('deposit')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'deposit'
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            <ArrowDownLeft className="w-4 h-4" /> Deposit
                        </button>
                        <button
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'withdraw'
                                ? 'bg-white text-black'
                                : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            <ArrowUpRight className="w-4 h-4" /> Withdraw
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'deposit' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-400">
                                    <p className="mb-2 font-bold text-white uppercase tracking-widest">Your Unique Deposit Address</p>
                                    <p className="mb-4">Send USDC on the <strong className="text-emerald-400">Polygon Network</strong> from Binance to your personal Embedded Smart Wallet address below:</p>
                                    <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-white/10 mb-2">
                                        <span className="font-mono text-[10px] sm:text-xs break-all text-white select-all">
                                            {user?.smartWallet?.address || 'Generating wallet...'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">Funds sent here will automatically reflect in your AfriVault balance. No TxHash needed.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount ({currency})</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">{currency === 'USD' ? '$' : 'USh'}</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                                            placeholder="0.00"
                                            required={activeTab === 'withdraw'}
                                            min="1"
                                            step="0.01"
                                            max={currency === 'USD' ? user?.balance : (user?.balance || 0) * exchangeRate}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Binance / Polygon USDC Address</label>
                                    <input
                                        type="text"
                                        value={withdrawAddress}
                                        onChange={(e) => setWithdrawAddress(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-xs"
                                        placeholder="0x..."
                                        required={activeTab === 'withdraw'}
                                    />
                                    <p className="mt-2 text-[10px] text-zinc-500">Funds will be sent automatically to this address on the Polygon Network.</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || (activeTab === 'deposit' && !user?.smartWallet?.address)}
                            className={`w-full py-4 font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${activeTab === 'deposit'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                                : 'bg-white hover:bg-zinc-200 text-black'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (activeTab === 'deposit' ? 'I Have Deposited' : 'Withdraw Funds')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
