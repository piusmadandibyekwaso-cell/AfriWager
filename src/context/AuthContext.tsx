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
            console.log("Fetching data for user:", currentUser.id);

            // 1. Fetch Profile (KYC)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username, kyc_status, phone_number, nin, district, country_code')
                .eq('wallet_address', currentUser.id) // Migration: Check if this maps correctly
                .maybeSingle();

            if (profileError) console.error("Profile fetch error:", profileError);

            // 2. Fetch Balance (AfriVault Ledger)
            const { data: balanceData, error: balanceError } = await supabase
                .from('user_balances')
                .select('balance_usdc')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (balanceError) console.error("Balance fetch error:", balanceError);
            console.log("Balance Data Found:", balanceData);

            return {
                ...currentUser,
                profile: profile || undefined,
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
