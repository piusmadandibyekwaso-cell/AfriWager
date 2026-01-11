import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { userService, UserProfile } from '@/services/userService';

export function useUserProfile() {
    const { address, isConnected } = useAccount();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Define fetch function outside useEffect to allow manual refreshing
    const fetchProfile = useCallback(async () => {
        if (isConnected && address) {
            try {
                const data = await userService.getProfile(address);
                setProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                // Don't clear profile on error, just stop loading
            } finally {
                setIsLoading(false);
            }
        } else {
            setProfile(null);
            setIsLoading(false);
        }
    }, [isConnected, address]);

    // Initial Fetch
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Function to manually update profile (e.g. after creation)
    const refreshProfile = async () => {
        setIsLoading(true);
        await fetchProfile();
    };

    return {
        profile,
        isLoading: isLoading && isConnected, // Only considered loading if we are connected
        fetchProfile,
        refreshProfile
    };
}
