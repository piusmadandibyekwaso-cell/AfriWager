
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting market refinement migration with UPSERT...');

    // STRATEGY: RLS blocks Update/Delete. We will INSERT NEW corrected records and Soft-Delete the old ones in the app code.

    // 1. Insert NEW Joshua Baraka Market (ID ...0044)
    console.log('Inserting NEW Joshua Baraka market...');
    const { error: barakaError } = await supabase
        .from('markets')
        .insert({
            id: '550e8400-e29b-41d4-a716-446655440044', // NEW ID
            question: "Will Joshua Baraka win a BET Award in 2026?",
            image_url: "https://softpower.ug/wp-content/uploads/2024/05/Joshua-Baraka.jpg",
            description: "This market resolves to YES if Joshua Baraka wins a BET Award in any category at the 2026 ceremony. Resolution based on official BET winners list.",
            category: "Music",
            status: "OPEN",
            end_date: "2026-07-01T00:00:00Z",
            condition_id: "0xABC...DEF",
            total_volume_usdc: 0,
            outcome_tokens: ["Yes", "No"],
            yes_pool: 500, // LIQUIDITY FLOOR
            no_pool: 500   // LIQUIDITY FLOOR
        });

    if (barakaError) console.error('Error inserting new Joshua Baraka:', barakaError);
    else console.log('Successfully inserted new Joshua Baraka market.');


    // 2. Insert NEW AFCON Market (ID ...0077)
    console.log('Inserting NEW AFCON 2026 market...');
    const { error: afconUpdateError } = await supabase
        .from('markets')
        .insert({
            id: '550e8400-e29b-41d4-a716-446655440077', // NEW ID
            question: "Who will win the AFCON Final (played Jan 18, 2026)?",
            description: "Prediction market for the winner of the 2025/26 Africa Cup of Nations.",
            category: "Sports",
            end_date: "2026-01-19T00:00:00Z",
            status: "OPEN",
            condition_id: "0x456...def_v2", // Updated to avoid unique constraint collision
            total_volume_usdc: 85000,
            outcome_tokens: ["Morocco", "Senegal", "Nigeria", "Other"],
            image_url: "https://www.cafonline.com/media/ylplke4l/itri-hd.jpg",
            yes_pool: 500, // LIQUIDITY FLOOR
            no_pool: 500   // LIQUIDITY FLOOR
        });

    if (afconUpdateError) console.error('Error inserting new AFCON:', afconUpdateError);
    else console.log('Successfully inserted new AFCON market.');

    console.log('Migration complete. Remember to check marketService.ts excludes the old IDs.');
}

migrate().catch(console.error);
