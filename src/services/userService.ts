import { supabase } from '@/lib/supabase';

export interface UserProfile {
    wallet_address: string;
    username: string;
    avatar_seed: string;
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
    async createProfile(walletAddress: string, username: string): Promise<UserProfile | null> {
        const avatar_seed = username; // Default seed is the username itself

        const { data, error } = await supabase
            .from('profiles')
            .insert([
                { wallet_address: walletAddress, username, avatar_seed }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            throw error;
        }

        return data as UserProfile;
    }
};
