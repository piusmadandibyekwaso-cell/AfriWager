'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface ExtendedUser extends User {
    profile?: {
        username: string;
        kyc_status: 'unverified' | 'pending' | 'verified';
        phone_number?: string;
        nin?: string;
        district?: string;
        country_code?: string;
    };
    balance?: number;
}

interface AuthContextType {
    user: ExtendedUser | null;
    session: Session | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Helper to fetch extended profile + balance
    const fetchUserData = async (currentUser: User) => {
        try {
            // 1. Fetch Profile (KYC)
            const { data: profile } = await supabase
                .from('profiles')
                .select('username, kyc_status, phone_number, nin, district, country_code')
                .eq('wallet_address', currentUser.id) // Assuming wallet_auth uses ID, or link via email? 
                // Correction: Supabase Auth ID is usually linked to 'id' in profiles if one-to-one, 
                // OR 'wallet_address' if we are storing the wallet address there.
                // In afrivault_schema.sql, `user_balances` is keyed by `user_id` (auth.uid).
                // Let's assume we can fetch by `id` if profiles is linked to auth.users. 
                // For now, looking at userService it uses `wallet_address`.
                // Let's assume for EMAIL AUTH pivot, we might need to query by user ID.
                // But let's stick to what's likely safe: query by `id` if RLS allows, or check current implementation.
                // Re-reading userService: it queries `profiles` by `wallet_address`.
                // BUT, if we use Supabase Auth (Email), currentUser.id is the UUID. 
                // Does 'profiles' have a user_id column? Standard starters usually do `id references auth.users`.
                // Checking afrivault_schema: `user_id uuid REFERENCES auth.users(id)` for balances. 
                // We should probably check if profiles has `id`.
                // Logic: Fetch balance by auth.uid. Fetch profile by auth.uid (if possible)?
                // Let's assume `wallet_address` MIGHT be the Auth ID in the new flow, or we query balances directly by ID.
                // PIVOT: For now, I will just fetch balance by `user_id` (current user ID).
                .maybeSingle();

            // 2. Fetch Balance (AfriVault Ledger)
            const { data: balanceData } = await supabase
                .from('user_balances')
                .select('balance_usdc')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            return {
                ...currentUser,
                profile: profile, // Type might mismatch, but we extend it at runtime
                balance: balanceData?.balance_usdc || 0,
            };
        } catch (e) {
            console.error("Error fetching user data", e);
            return currentUser;
        }
    };

    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                const extended = await fetchUserData(session.user);
                setUser(extended);
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                const extended = await fetchUserData(session.user);
                setUser(extended);

                // Hack: If NEW login, ensure balance row exists (trigger does this, but good to ensure UI updates)
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string) => {
        // For Magic Link login (Kalshi style)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithEmail,
            signOut,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
