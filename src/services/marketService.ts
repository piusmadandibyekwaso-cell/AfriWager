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
    }
};
