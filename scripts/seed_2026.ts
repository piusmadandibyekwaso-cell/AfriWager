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

const markets_2026 = [
    // --- POLITICS ---
    {
        question: "Who will win the 2026 Ugandan Presidential Election?",
        description: "Predicting the winner of the upcoming general election. Key candidates include incumbent President Museveni and opposition leaders.",
        category: "Politics",
        end_date: "2026-02-15T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1540910419868-47ed94367462?auto=format&fit=crop&q=80&w=1000", // Election/Voting
        total_volume_usdc: 125000,
        yes_pool: 5000,
        no_pool: 5000,
        outcome_tokens: ["Museveni", "Bobi Wine", "Muhoozi", "Other"]
    },
    {
        question: "Will Ghana achieve single-digit inflation by Q3 2026?",
        description: "Based on data from the Ghana Statistical Service. Current rate is hovering around high double digits.",
        category: "Politics",
        end_date: "2026-09-30T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&q=80&w=1000", // Ghana Currency/Economy
        total_volume_usdc: 45000,
        yes_pool: 2000,
        no_pool: 2000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will the ANC maintain 50%+ coalition support in SA Municipal Elections?",
        description: "Coverage of the 2026 Local Government Elections in South Africa.",
        category: "Politics",
        end_date: "2026-11-01T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1577962917302-cd874c4e3169?auto=format&fit=crop&q=80&w=1000", // South Africa Flag/Rally
        total_volume_usdc: 67000,
        yes_pool: 3000,
        no_pool: 3000,
        outcome_tokens: ["Yes", "No"]
    },

    // --- SPORTS ---
    {
        question: "Will East Africa 'Pamoja Bid' venues be 100% ready by Dec 2026?",
        description: "Tracking construction progress for AFCON 2027 host stadiums in Kenya, Uganda, and Tanzania.",
        category: "Sports",
        end_date: "2026-12-31T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1522778119026-d647f0565c71?auto=format&fit=crop&q=80&w=1000", // Stadium
        total_volume_usdc: 32000,
        yes_pool: 1500,
        no_pool: 1500,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Mohamed Salah extend his Liverpool contract into 2027?",
        description: "Contract negotiations for the Egyptian King. Resolves YES if official extension announced.",
        category: "Sports",
        end_date: "2026-06-30T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1628891435256-3f71ab48c02c?auto=format&fit=crop&q=80&w=1000", // Salah/Football (Generic)
        total_volume_usdc: 88000,
        yes_pool: 4000,
        no_pool: 4000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Dricus du Plessis retain the Middleweight Title throughout 2026?",
        description: "UFC Middleweight Championship tracking.",
        category: "Sports",
        end_date: "2026-12-31T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1000", // MMA/Boxing
        total_volume_usdc: 55000,
        yes_pool: 2500,
        no_pool: 2500,
        outcome_tokens: ["Yes", "No"]
    },

    // --- ECONOMICS ---
    {
        question: "Will the Ethiopian Birr stabilize (< 150 ETB/USD) by Q4 2026?",
        description: "Forex market tracking the official exchange rate of the Birr.",
        category: "Economics",
        end_date: "2026-12-31T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1620822601934-2e21b77742d2?auto=format&fit=crop&q=80&w=1000", // Money/Currency
        total_volume_usdc: 23000,
        yes_pool: 1200,
        no_pool: 1200,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Dangote Refinery reach 100% capacity by August 2026?",
        description: "Tracking production output milestones of Africa's largest refinery.",
        category: "Economics",
        end_date: "2026-08-31T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1563251268-d055465bf192?auto=format&fit=crop&q=80&w=1000", // Oil Refinery
        total_volume_usdc: 91000,
        yes_pool: 4500,
        no_pool: 4500,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will M-Pesa launch a standalone banking license in 2026?",
        description: "Fintech regulatory evolution in Kenya and Tanzania.",
        category: "Economics",
        end_date: "2026-12-31T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1565514020176-6c509025e6e6?auto=format&fit=crop&q=80&w=1000", // Mobile Money
        total_volume_usdc: 42000,
        yes_pool: 1800,
        no_pool: 1800,
        outcome_tokens: ["Yes", "No"]
    },

    // --- POP CULTURE & TECH ---
    {
        question: "Will Burna Boy win 'Album of the Year' at the 2026 Grammys?",
        description: "Music prediction for the 68th Annual Grammy Awards.",
        category: "Pop Culture",
        end_date: "2026-02-04T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1000", // Concert
        total_volume_usdc: 150000,
        yes_pool: 6000,
        no_pool: 6000,
        outcome_tokens: ["Yes", "No"]
    },
    {
        question: "Will Starlink be officially licensed in South Africa by mid-2026?",
        description: "Regulatory approval status from ICASA.",
        category: "Tech",
        end_date: "2026-06-30T00:00:00Z",
        image_url: "https://images.unsplash.com/photo-1548695607-9c73430ba065?auto=format&fit=crop&q=80&w=1000", // Satellite/Space
        total_volume_usdc: 78000,
        yes_pool: 3500,
        no_pool: 3500,
        outcome_tokens: ["Yes", "No"]
    }
];

async function seed2026() {
    console.log('🚀 Seeding 2026 Markets...');

    for (const m of markets_2026) {
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

seed2026();
