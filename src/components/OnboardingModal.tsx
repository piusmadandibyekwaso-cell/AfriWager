'use client';

import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { namingEngine } from '@/utils/namingEngine';
import UserAvatar from './Avatar';
import { Loader2, CheckCircle2, XCircle, User, RefreshCw, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from 'wagmi';

export default function OnboardingModal() {
    const { user } = useAuth(); // for session
    const { address } = useAccount(); // for wallet
    const { profile, isLoading, refreshProfile } = useUserProfile();

    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // CMA Compliance State
    const [isOfAge, setIsOfAge] = useState(false);
    const [understandsRisk, setUnderstandsRisk] = useState(false);
    const [agreesToTerms, setAgreesToTerms] = useState(false);
    const [nin, setNin] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const router = useRouter();

    // Show if we have a wallet connected AND we're not loading AND we have no profile
    const ready = !isLoading && !!address;
    const authenticated = !!user; // or just checking address? profile requires address.

    // Check if user has a profile when they log in
    useEffect(() => {
        if (ready && authenticated && !isLoading && !profile) {
            setIsOpen(true);
            generateIdentity();
        } else if (ready && authenticated && !isLoading && profile) {
            setIsOpen(false);
        }
    }, [ready, authenticated, isLoading, profile]);

    const generateIdentity = async () => {
        setIsChecking(true);
        try {
            const name = await namingEngine.generateUniqueSovereignName(
                (n) => userService.checkUsernameAvailability(n)
            );
            setUsername(name);
            setIsAvailable(true);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate identity.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !isAvailable || !isOfAge || !understandsRisk || !agreesToTerms) return;

        setIsSubmitting(true);
        setError('');

        try {
            // Pass KYC data to createProfile
            await userService.createProfile(address, username, {
                phone: phoneNumber,
                nin: nin,
                // district: district // Add this field if added to UI
            });

            await refreshProfile(); // Update the global profile state
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating profile:', error);
            setError('Failed to create profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>

                <div className="relative text-center">
                    <div className="flex justify-center mb-2">
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Bit 4 Enabled</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Sovereign Identity</h2>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">Establish your institutional presence</p>

                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <UserAvatar
                                name={username || 'user'}
                                size={96}
                                className="ring-4 ring-black shadow-xl"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-zinc-800 text-xs px-2 py-1 rounded-full border border-zinc-700 text-zinc-300">
                                Preview
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Shield className="h-4 w-4 text-emerald-500/50" />
                            </div>
                            <div className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-4 pl-10 pr-12 text-white font-black tracking-tight text-lg shadow-inner">
                                {isChecking ? (
                                    <span className="text-zinc-700 animate-pulse">GENERATING...</span>
                                ) : (
                                    username
                                )}
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <button
                                    type="button"
                                    onClick={generateIdentity}
                                    disabled={isChecking || isSubmitting}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors group/btn disabled:opacity-30"
                                    title="Regenerate Identity"
                                >
                                    <RefreshCw className={`h-5 w-5 text-zinc-500 group-hover/btn:text-emerald-500 transition-colors ${isChecking ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-bold text-white">KYC Verification</h3>
                            <input
                                type="text"
                                value={nin}
                                onChange={(e) => setNin(e.target.value)}
                                placeholder="National ID (NIN) / Passport No."
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm"
                                required
                            />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Mobile Money Registered Name"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isOfAge}
                                    onChange={(e) => setIsOfAge(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                                />
                                <span className="text-xs text-zinc-400 group-hover:text-zinc-300">I confirm that I am 18 years of age or older.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={understandsRisk}
                                    onChange={(e) => setUnderstandsRisk(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                                />
                                <span className="text-xs text-zinc-400 group-hover:text-zinc-300">I understand that trading event contracts involves financial risk and possible loss of capital.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={agreesToTerms}
                                    onChange={(e) => setAgreesToTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                                />
                                <span className="text-xs text-zinc-400 group-hover:text-zinc-300">I agree to the AfriWager Terms of Use and Risk Disclosure.</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!isAvailable || isSubmitting || username.length < 3 || !isOfAge || !understandsRisk || !agreesToTerms || !nin || !phoneNumber}
                            className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/5"
                        >
                            {isSubmitting ? 'Verifying...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
