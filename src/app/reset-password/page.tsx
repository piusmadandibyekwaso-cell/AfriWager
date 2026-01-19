'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            setMessage('Password updated successfully! Redirecting...');
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
            <div className="w-full max-w-sm rounded-[24px] bg-[#1C1C1C] p-8 text-center shadow-2xl border border-white/5">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/10">
                    <Lock className="h-6 w-6 text-[#10b981]" />
                </div>

                <h1 className="mb-2 text-xl font-bold text-white">Reset Password</h1>
                <p className="mb-6 text-sm text-gray-400">Enter your new password below.</p>

                <form onSubmit={handleReset} className="space-y-4">
                    <div className="relative text-left">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-white/20"
                            placeholder="New Password"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-500">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-[#10b981] py-3 text-sm font-bold text-white transition-transform active:scale-[0.98] hover:bg-[#059669] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
