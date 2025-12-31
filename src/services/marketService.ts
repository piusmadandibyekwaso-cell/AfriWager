import { supabase } from '@/lib/supabase';

// Market Type Definition
export interface Market {
    id: string;
    condition_id: string;
    question: string;
    description: string;
    category: string;
    outcome_tokens: string[];
    contract_address: string;
    image_url: string;
    end_date: string;
    status: 'OPEN' | 'RESOLVED' | 'PAUSED';
    total_volume_usdc: number;
}

export const marketService = {
    // Fetch all active markets
    async getMarkets(): Promise<Market[]> {
        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('status', 'OPEN')
            .order('total_volume_usdc', { ascending: false });

        if (error) {
            console.error('Error fetching markets:', error);
            return [];
        }

        return data as Market[];
    },

    // Fetch a single market by ID
    async getMarketById(id: string): Promise<Market | null> {
        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching market:', error);
            return null;
        }

        return data as Market;
    },

    // Fetch trade history for charts
    async getTradeHistory(marketId: string) {
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('market_id', marketId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching trade history:', error);
            return [];
        }

        return data;
    },

    // Global Platform Stats
    async getPlatformStats() {
        // 1. Total Volume (Sum of all markets)
        const { data: markets, error: marketError } = await supabase
            .from('markets')
            .select('total_volume_usdc');

        const totalVolume = markets?.reduce((acc, m) => acc + (m.total_volume_usdc || 0), 0) || 0;

        // 2. Active Traders (Count unique users in trades)
        // Note: In a real large-scale app, this should be an RPC or cached value.
        // For now, we'll estimate based on trade count or fetch unique signers if efficient.
        const { count, error: tradeError } = await supabase
            .from('trades')
            .select('*', { count: 'exact', head: true }); // Head=true for faster counting

        // We'll use trade count as a proxy for "Active Activity" for now if unique user count is too heavy
        // Or if we want unique users:
        // const { data: uniqueTraders } = await supabase.rpc('count_unique_traders');

        return {
            totalVolume,
            activeTraders: count || 0, // Using transaction count as "Active Activity" for speed, or placeholder
            payoutSpeed: 'Instant'
        };
    }
};
