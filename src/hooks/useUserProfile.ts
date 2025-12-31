import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { userService, UserProfile } from '@/services/userService';

export function useUserProfile() {
    const { user, authenticated, ready } = usePrivy();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Define fetch function outside useEffect to allow manual refreshing
    const fetchProfile = useCallback(async () => {
        if (!ready) return;

        if (authenticated && user?.wallet?.address) {
            // Don't set loading to true here to avoid UI flickering if we're just refreshing
            // But for initial load, it's fine.
            try {
                const data = await userService.getProfile(user.wallet.address);
                setProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setProfile(null);
            setIsLoading(false);
        }
    }, [ready, authenticated, user?.wallet?.address]);

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
        isLoading: isLoading && authenticated, // Only considered loading if we are supposedly authenticated
        fetchProfile,
        refreshProfile
    };
}
