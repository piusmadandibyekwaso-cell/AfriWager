
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, X, Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, Copy, Check } from 'lucide-react';
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
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (activeTab === 'deposit') {
            sendNotification('Balance Syncing', {
                body: `Refreshing your wallet balance. Please wait a few seconds for network confirmation.`
            });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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
                    <div className="flex items-center justify-center mb-8">
                        <h2 className="text-xl font-semibold text-white tracking-tight">
                            Wallet
                        </h2>
                    </div>

                    {/* Balance Display */}
                    <div className="text-center mb-10">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">Total Balance</p>
                        <h3 className="text-5xl font-semibold text-white tracking-tight">
                            {currency === 'USD'
                                ? `$${user?.balance?.toFixed(2) || '0.00'}`
                                : `USh ${((user?.balance || 0) * exchangeRate).toLocaleString()}`
                            }
                        </h3>
                        
                        <div className="flex justify-center mt-4">
                            <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                                <button
                                    onClick={() => setCurrency('USD')}
                                    className={`px-4 py-1.5 text-[9px] font-bold rounded-full transition-all ${currency === 'USD' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    USD
                                </button>
                                <button
                                    onClick={() => setCurrency('UGX')}
                                    className={`px-4 py-1.5 text-[9px] font-bold rounded-full transition-all ${currency === 'UGX' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    UGX
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab('deposit')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${activeTab === 'deposit'
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                : 'bg-transparent border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                }`}
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${activeTab === 'withdraw'
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-transparent border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                }`}
                        >
                            Withdraw
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'deposit' ? (
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Deposit via Polygon (Binance)</p>
                                        <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-white/10 mb-4 group/addr">
                                            <span className="font-mono text-[11px] text-zinc-300 break-all select-all">
                                                {user?.smartWallet?.address || 'Generating...'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (user?.smartWallet?.address) {
                                                        navigator.clipboard.writeText(user.smartWallet.address);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }
                                                }}
                                                className="ml-3 p-2 text-zinc-500 hover:text-white transition-colors"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
                                            Your unique address. Funds reflect after 1 confirmation.
                                        </p>
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
                            className={`w-full py-4 font-bold rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${activeTab === 'deposit'
                                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                : 'bg-white text-black hover:bg-zinc-200'
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
