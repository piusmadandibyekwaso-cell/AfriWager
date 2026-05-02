'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export default function SovereignGate({ children }: { children: React.ReactNode }) {
    const { user, isMFAVerified, verifyMFA } = useAuth();
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    if (!user?.isAdmin) return <>{children}</>;
    if (isMFAVerified) return <>{children}</>;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');

        const success = await verifyMFA(code);
        if (!success) {
            setError('Invalid authentication code. Access Denied.');
        }
        setIsVerifying(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#060709] flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
                        <Lock className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white mb-4 uppercase">Sovereign Gate</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">
                        Identity confirmed: <span className="text-rose-500">{user.email}</span>
                        <br />
                        Awaiting second-factor hardware validation.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000 000"
                            className="relative w-full bg-black border border-white/10 rounded-2xl py-6 px-4 text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder:text-zinc-900"
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={isVerifying || code.length < 6}
                        className="w-full py-6 bg-white hover:bg-rose-500 text-black font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-20"
                    >
                        {isVerifying ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Validate Identity</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 flex items-center justify-center gap-6 opacity-20">
                    <ShieldCheck className="w-5 h-5" />
                    <div className="h-px w-12 bg-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol v2.1</span>
                </div>
            </div>
        </div>
    );
}
