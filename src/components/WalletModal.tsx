
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
    const [phone, setPhone] = useState(user?.profile?.phone_number || ''); // Try to pre-fill
    // Note: TypeScript might complain about nested profile access if not fully typed, checking safely below
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activeTab === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
                    amountUSD: parseFloat(amount),
                    phoneNumber: phone
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            sendNotification(activeTab === 'deposit' ? 'Deposit Successful' : 'Withdrawal Processed', {
                body: `${activeTab === 'deposit' ? 'Credited' : 'Sent'} $${amount} to ${phone}`,
            });
            onClose();
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
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-6 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-emerald-500" /> AfriVault Wallet
                    </h2>

                    {/* Balance Display */}
                    <div className="bg-zinc-900/50 rounded-2xl p-6 mb-8 text-center border border-white/5">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Available Balance</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">${user?.balance?.toFixed(2) || '0.00'}</h3>
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
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                                    placeholder="0.00"
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Mobile Money Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                                placeholder="+256..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${activeTab === 'deposit'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                                : 'bg-white hover:bg-zinc-200 text-black'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (activeTab === 'deposit' ? 'Confirm Deposit' : 'Request Withdrawal')}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            Secure Mobile Money Transaction (MTN/Airtel)
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
