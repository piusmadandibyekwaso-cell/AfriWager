import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const crisis_markets = [
    {
        question: "Will Nigerian petrol pump prices officially exceed ₦1,000/liter by June 2026?",
        description: "Evaluating the fuel subsidy impact amidst the Middle East oil price shock.",
        category: "Economics",
        end_date: "2026-06-30T00:00:00Z",
        image_url: "/market-images/crisis_nigeria.svg",
        total_volume_usdc: 156000,
        yes_pool: 6000,
        no_pool: 6000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Ghana's inflation rate cross back above 30% by Q3 2026?",
        description: "Tracking the secondary inflationary shock driven by global shipping reroutes.",
        category: "Economics",
        end_date: "2026-09-30T00:00:00Z",
        image_url: "/market-images/crisis_ghana.svg",
        total_volume_usdc: 92000,
        yes_pool: 3500,
        no_pool: 3500,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will the Central Bank of Kenya (CBK) hike interest rates in Q2 2026?",
        description: "Assessing monetary policy response to global fuel-driven inflation.",
        category: "Politics",
        end_date: "2026-06-30T00:00:00Z",
        image_url: "/market-images/crisis_kenya.svg",
        total_volume_usdc: 78000,
        yes_pool: 3000,
        no_pool: 3000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will the South African Rand (ZAR) breach R20 to $1 USD by May 2026?",
        description: "Tracking currency depreciation caused by risk-off sentiment and high import bills.",
        category: "Economics",
        end_date: "2026-05-31T00:00:00Z",
        image_url: "/market-images/crisis_zar.svg",
        total_volume_usdc: 245000,
        yes_pool: 12000,
        no_pool: 12000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Brent Crude Oil touch $100 per barrel before August 2026?",
        description: "The global indicator of the Middle East conflict's severity.",
        category: "Economics",
        end_date: "2026-07-31T00:00:00Z",
        image_url: "/market-images/crisis_brent.svg",
        total_volume_usdc: 650000,
        yes_pool: 40000,
        no_pool: 40000,
        outcome_tokens: ["Yes", "No"]
    }
];

async function seedCrisisMarkets() {
    console.log('🚀 Seeding March 2026 Crisis Markets...');

    for (const m of crisis_markets) {
        // Check for existing market to avoid duplicates
        const { data: existing } = await supabase
            .from('markets')
            .select('id')
            .eq('question', m.question)
            .single();

        if (existing) {
            console.log(`⚠️  Skipping (Already Exists): ${m.question}`);
            continue;
        }

        // Insert new market
        const { error } = await supabase
            .from('markets')
            .insert({
                question: m.question,
                description: m.description,
                category: m.category,
                end_date: m.end_date,
                image_url: m.image_url,
                total_volume_usdc: m.total_volume_usdc,
                yes_pool: m.yes_pool,
                no_pool: m.no_pool,
                outcome_tokens: m.outcome_tokens,
                condition_id: `0x${crypto.randomBytes(32).toString('hex')}`,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error(`❌ Error Seeding ${m.question}:`, error);
        } else {
            console.log(`✅ Seeded: ${m.question}`);
        }
    }
}

seedCrisisMarkets();
