'use client';

import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import UserAvatar from './Avatar';
import { Loader2, CheckCircle2, XCircle, User } from 'lucide-react';
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
    const router = useRouter();

    // Show if we have a wallet connected AND we're not loading AND we have no profile
    const ready = !isLoading && !!address;
    const authenticated = !!user; // or just checking address? profile requires address.

    // Check if user has a profile when they log in
    useEffect(() => {
        // Only determine if we should open the modal once loading is done
        if (ready && authenticated && !isLoading) {
            if (!profile) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        }
    }, [ready, authenticated, isLoading, profile]);

    // Debounced username check
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (username.length >= 3) {
                setIsChecking(true);
                try {
                    const available = await userService.checkUsernameAvailability(username);
                    setIsAvailable(available);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsChecking(false);
                }
            } else {
                setIsAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !isAvailable) return;

        setIsSubmitting(true);
        setError('');

        try {
            await userService.createProfile(address, username);
            await refreshProfile(); // Update the global profile state
            setIsOpen(false);
            // router.refresh(); // No longer needed as state updates instantly
        } catch (error) {
            console.error('Error creating profile:', error);
            setError('Failed to create profile. Please try again.');
            // Show error toast
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
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to AfriSights</h2>
                    <p className="text-zinc-400 text-sm mb-6">Choose a unique username to establish your digital identity.</p>

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
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-zinc-500 font-bold">@</span>
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                                    setUsername(val);
                                }}
                                placeholder="username"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-8 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                                minLength={3}
                                maxLength={20}
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                {isChecking ? (
                                    <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
                                ) : isAvailable === true ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : isAvailable === false && username.length >= 3 ? (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                ) : null}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={!isAvailable || isSubmitting || username.length < 3}
                            className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/5"
                        >
                            {isSubmitting ? 'Creating Identity...' : 'Complete Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
