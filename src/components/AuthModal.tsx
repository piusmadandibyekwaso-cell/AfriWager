'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Loader2 } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const { signInWithEmail } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                // Login with Password
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else {
                // Sign Up with Password
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-[#1C1C1C] p-6 shadow-2xl border border-white/10">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="mb-6 text-center text-2xl font-bold text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                <div className="mb-6 flex rounded-lg bg-white/5 p-1">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${isLogin ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${!isLogin ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm text-gray-400">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#10b981]"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-gray-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#10b981]"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#10b981] py-3 font-semibold text-white transition-all hover:bg-[#059669] disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        ) : (
                            isLogin ? 'Log In' : 'Create Account'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
