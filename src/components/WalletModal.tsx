
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
    const [phone, setPhone] = useState(user?.profile?.phone_number || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currency, setCurrency] = useState<'USD' | 'UGX'>('USD');
    const exchangeRate = 3850; // 1 USD = 3850 UGX

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Convert UGX back to USD for API
            const amountUSD = currency === 'USD' ? parseFloat(amount) : parseFloat(amount) / exchangeRate;

            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activeTab === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
                    amountUSD: amountUSD,
                    phoneNumber: phone
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            sendNotification(activeTab === 'deposit' ? 'Deposit Successful' : 'Withdrawal Processed', {
                body: `${activeTab === 'deposit' ? 'Credited' : 'Sent'} ${currency === 'USD' ? '$' : 'USh '}${amount} to ${phone}`,
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
                                ? 'bg-[#F7C325] hover:bg-[#E5B214] text-black shadow-amber-500/20'
                                : 'bg-white hover:bg-zinc-200 text-black'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (activeTab === 'deposit' ? 'Pay with Yellow Card' : 'Withdraw via Yellow Card')}
                        </button>

                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#F7C325]"></span>
                                Powered by <strong>Yellow Card</strong> Sandbox
                            </div>

                            <div className="p-3 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800 text-[10px] text-zinc-600 text-left">
                                <p className="font-bold text-zinc-500 mb-2 uppercase tracking-widest">🧪 Sandbox Test Credentials:</p>
                                <div className="space-y-1 font-mono">
                                    <div className="flex justify-between">
                                        <span>Success:</span> <span className="text-emerald-500">+256 111 111 1111</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Failure:</span> <span className="text-rose-500">+256 000 000 0000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
