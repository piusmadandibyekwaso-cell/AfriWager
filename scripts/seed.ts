
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
            total_volume_usdc: 0
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440004",
            question: "Will Joshua Baraka win a BET Award in 2026?",
            description: "This market resolves to YES if Joshua Baraka wins a BET Award in any category at the 2026 ceremony. Resolution based on official BET winners list.",
            end_date: "2026-07-01T00:00:00Z",
            category: "Music",
            image_url: "https://softpower.ug/wp-content/uploads/2024/05/Joshua-Baraka.jpg",
            condition_id: "0xABC...DEF", // Placeholder
            outcome_tokens: ["Yes", "No"],
            status: "OPEN",
            total_volume_usdc: 0
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440005",
            question: "Will at least 3 African nations qualify for the Round of 32 in the 2026 World Cup?",
            description: "Resolves to YES if 3 or more CAF teams advance from their groups.",
            end_date: "2026-07-01T00:00:00Z",
            category: "Sports",
            image_url: "https://images.unsplash.com/photo-1541873676947-d31229153026?auto=format&fit=crop&q=80&w=800", // Generic football
            condition_id: "0xDEF...GHI", // Placeholder
            outcome_tokens: ["Yes", "No"],
            status: "OPEN",
            total_volume_usdc: 0
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440006",
            question: "Will Starlink be officially live in at least 40 African countries by Dec 31, 2026?",
            description: "Based on official Starlink availability map and roadmap.",
            end_date: "2026-12-31T23:59:59Z",
            category: "Tech",
            image_url: "https://images.unsplash.com/photo-1549488497-60a6949d21ee?auto=format&fit=crop&q=80&w=800",
            condition_id: "0xGHI...JKL", // Placeholder
            outcome_tokens: ["Yes", "No"],
            status: "OPEN",
            total_volume_usdc: 0
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440007",
            question: "Who will win the AFCON Final (played Jan 18, 2026)?",
            description: "Prediction market for the winner of the 2025/26 Africa Cup of Nations.",
            end_date: "2026-01-19T00:00:00Z",
            category: "Sports",
            image_url: "https://www.cafonline.com/media/ylplke4l/itri-hd.jpg",
            condition_id: "0x456...def", // Reusing old condition_id for AFCON
            outcome_tokens: ["Morocco", "Senegal", "Nigeria", "Other"],
            status: "OPEN",
            total_volume_usdc: 0
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
            total_volume_usdc: 0
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
