import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    // Progressive Auth State
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

    // Derived State
    const showPasswordInput = email.length > 0;

    const { signInWithEmail } = useAuth();

    // Reset state when closing or switching modes
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setError(null);
            setMessage(null);
            setForgotPasswordMode(false);
        }
    }, [isOpen]);

    // Password Validation Logic
    const validation = useMemo(() => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }, [password]);

    const isPasswordValid = validation.length && validation.uppercase && validation.symbol;

    if (!isOpen) return null;

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setMessage('Password reset instructions sent to your email.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Block signup if password isn't strong enough
        if (!isLogin && !isPasswordValid) {
            setError('Please meet all password requirements');
            return;
        }

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
                    options: {
                        emailRedirectTo: `${window.location.origin}/`,
                    },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className="relative w-full max-w-sm rounded-xl bg-[#1C1C1C] p-6 shadow-2xl border border-white/5 transition-all duration-300 ease-in-out">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-6 text-center text-xl font-bold text-white">
                    {forgotPasswordMode ? 'Reset Password' : (isLogin ? 'Log in' : 'Sign up')}
                </h2>

                {!forgotPasswordMode && (
                    <div className="mb-6 space-y-3">
                        <button
                            onClick={async () => {
                                try {
                                    const { error } = await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo: window.location.origin },
                                    });
                                    if (error) throw error;
                                } catch (err: any) { setError(err.message); }
                            }}
                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition-transform active:scale-[0.98] hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="mx-3 flex-shrink-0 text-[11px] font-medium text-gray-500">OR</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>
                    </div>
                )}

                <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-white/20"
                            placeholder="Email address"
                            required
                        />
                    </div>

                    {/* Progressive Disclosure Section for Password */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showPasswordInput && !forgotPasswordMode ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-white/20"
                                placeholder="Password"
                                required={!forgotPasswordMode && showPasswordInput}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {!isLogin && password.length > 0 && (
                            <div className="mt-3 space-y-2 rounded-lg bg-white/5 p-3">
                                <p className="text-[10px] font-medium text-gray-400">Password Requirements:</p>
                                <div className="grid grid-cols-1 gap-1">
                                    <Requirement met={validation.length} label="8+ chars" />
                                    <Requirement met={validation.uppercase} label="Uppercase letter" />
                                    <Requirement met={validation.symbol} label="Symbol or number" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error & Success Messages */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-500 animate-in fade-in slide-in-from-top-1">
                            <Check className="h-4 w-4 shrink-0" />
                            {message}
                        </div>
                    )}

                    {/* Dynamic Submit Button */}
                    {(showPasswordInput || forgotPasswordMode) && (
                        <button
                            type="submit"
                            disabled={loading || (!isLogin && !forgotPasswordMode && !isPasswordValid)}
                            className="w-full rounded-lg bg-[#10b981] py-3 text-sm font-bold text-white transition-all hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                            ) : (
                                forgotPasswordMode ? 'Send Reset Link' : (isLogin ? 'Log In' : 'Create Account')
                            )}
                        </button>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="mt-6 text-center space-y-3">
                    {!forgotPasswordMode && isLogin && showPasswordInput && (
                        <button
                            onClick={() => setForgotPasswordMode(true)}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Forgot password?
                        </button>
                    )}

                    {forgotPasswordMode && (
                        <button
                            onClick={() => setForgotPasswordMode(false)}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Back to Log In
                        </button>
                    )}

                    {!forgotPasswordMode && (
                        <div className="text-xs text-gray-500">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setMessage(null);
                                    setPassword('');
                                }}
                                className="font-semibold text-white hover:underline"
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-2 text-[10px] transition-colors ${met ? 'text-[#10b981]' : 'text-gray-500'}`}>
            <div className={`h-1 w-1 rounded-full ${met ? 'bg-[#10b981]' : 'bg-gray-500'}`} />
            {label}
        </div>
    );
}
