
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Seeding Markets...');

    const markets = [
        {
            question: "Will Nigeria's GDP grow by more than 3% in 2025?",
            description: "Prediction market on the annual GDP growth rate of Nigeria for the fiscal year 2025 as reported by the NBS.",
            category: "Economics",
            end_date: new Date("2025-12-31").toISOString(),
            condition_id: "0x123...abc",
            outcome_tokens: ["Yes", "No"],
            image_url: "https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&q=80&w=1000",
            status: "OPEN",
            total_volume_usdc: 15420
        },
        {
            question: "Who will win the 2025 AFCON?",
            description: "Winner of the Africa Cup of Nations 2025.",
            category: "Sports",
            end_date: new Date("2026-02-14").toISOString(), // Adjusted date
            condition_id: "0x456...def",
            outcome_tokens: ["Morocco", "Senegal", "Nigeria", "Other"],
            image_url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1000",
            status: "OPEN",
            total_volume_usdc: 85000
        },
        {
            question: "Will Bitcoin hit $150k before December 2025?",
            description: "Market resolves to Yes if BTC/USD price on Binance exceeds $150,000 at any point before Dec 1, 2025.",
            category: "Crypto",
            end_date: new Date("2025-12-01").toISOString(),
            condition_id: "0x789...ghi",
            outcome_tokens: ["Yes", "No"],
            image_url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=1000",
            status: "OPEN",
            total_volume_usdc: 230500
        }
    ];

    const { error } = await supabase.from('markets').insert(markets);

    if (error) {
        console.error('Error inserting markets:', error);
    } else {
        console.log('✅ Successfully seeded 3 markets!');
    }
}

seed();
