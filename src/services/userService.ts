import { supabase } from '@/lib/supabase';

export interface UserProfile {
    wallet_address: string;
    username: string;
    avatar_seed: string;
    last_funding_address?: string;
    kyc_status?: 'unverified' | 'pending' | 'verified';
    phone_number?: string;
    nin?: string;
    district?: string;
    country_code?: string;
    created_at?: string;
}

export const userService = {
    // Get profile by wallet address
    async getProfile(walletAddress: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching profile:', error);
            return null;
        }

        return data as UserProfile;
    },

    // Check if a username is taken
    async checkUsernameAvailability(username: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        // If we find a row, it's taken (return false). If no row (error PGRST116), it's available (return true).
        if (data) return false;
        return true;
    },

    // Create a new profile
    async createProfile(
        walletAddress: string,
        username: string,
        kycData?: { phone?: string; nin?: string; district?: string }
    ): Promise<UserProfile | null> {
        const avatar_seed = username; // Default seed is the username itself

        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    wallet_address: walletAddress,
                    username,
                    avatar_seed,
                    // Save KYC data if provided, default status to 'pending'
                    ...(kycData && {
                        phone_number: kycData.phone,
                        nin: kycData.nin,
                        district: kycData.district,
                        kyc_status: 'pending' // Auto-set to pending for sandbox
                    })
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            throw error;
        }

        return data as UserProfile;
    },

    // Update profile (e.g. set last funding address)
    async updateProfile(walletAddress: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('wallet_address', walletAddress)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        return data as UserProfile;
    }
};
