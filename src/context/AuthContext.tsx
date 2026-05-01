'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePrivy, useWallets, WalletWithMetadata } from '@privy-io/react-auth';

export interface ExtendedUser {
    id: string; // Privy user ID or Wallet Address
    email?: string;
    profile?: {
        username: string;
        kyc_status: 'unverified' | 'pending' | 'verified';
        phone_number?: string;
        nin?: string;
        district?: string;
        country_code?: string;
    };
    balance?: number;
    smartWallet?: WalletWithMetadata;
}

interface AuthContextType {
    user: ExtendedUser | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, ready: privyReady, authenticated, login, logout } = usePrivy();
    const { wallets } = useWallets();
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Get the embedded smart wallet
    const smartWallet = wallets.find((wallet: any) => wallet.walletClientType === 'privy');

    const fetchUserData = async (walletAddress: string, email?: string) => {
        try {
            console.log("Fetching data for wallet:", walletAddress);

            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username, kyc_status, phone_number, nin, district, country_code')
                .eq('wallet_address', walletAddress)
                .maybeSingle();

            if (profileError) console.error("Profile fetch error:", profileError);

            // 2. Fetch Balance (AfriVault Ledger)
            const { data: balanceData, error: balanceError } = await supabase
                .from('user_balances')
                .select('balance_usdc')
                .eq('user_id', walletAddress)
                .maybeSingle();

            if (balanceError) console.error("Balance fetch error:", balanceError);
            
            // If balance doesn't exist, create it (Shadow Wallet Initialization)
            if (!balanceData && !balanceError) {
                 await supabase.from('user_balances').insert({
                     user_id: walletAddress,
                     balance_usdc: 0
                 });
                 // Optional: insert profile stub here as well if needed
            }

            return {
                id: walletAddress,
                email: email,
                profile: profile || undefined,
                balance: balanceData?.balance_usdc || 0,
                smartWallet
            };
        } catch (e) {
            console.error("Error fetching user data", e);
            return null;
        }
    };

    useEffect(() => {
        const syncPrivyState = async () => {
            if (privyReady) {
                if (authenticated && privyUser && smartWallet) {
                    const email = privyUser.email?.address;
                    const walletAddress = smartWallet.address;
                    const extended = await fetchUserData(walletAddress, email);
                    setUser(extended);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        };

        syncPrivyState();
    }, [privyReady, authenticated, privyUser, smartWallet]);

    const signInWithEmail = async (email: string) => {
        // We defer to Privy's login modal. Custom email login flow can be configured via Privy SDK if needed.
        login();
        return { error: null };
    };

    const signOut = async () => {
        await logout();
        setUser(null);
    };

    const openAuthModal = () => login();
    const closeAuthModal = () => {}; // No-op since Privy handles its own modal state

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signInWithEmail,
            signOut,
            isAuthModalOpen: false, // Default to false
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
