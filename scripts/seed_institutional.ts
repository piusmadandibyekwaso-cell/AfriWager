import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedInstitutionalMarkets() {
    console.log('🏦 Seeding Institutional Markets...');

    const markets = [
        {
            question: "Will the Bank of Uganda hold rates steady in Q1 2026?",
            description: "Forecasting the Central Bank Rate (CBR) decision. A 'Hold' implies rates remain at 9.5%. 'Change' implies a cut or hike.",
            category: "Economics",
            end_date: new Date('2026-03-31').toISOString(),
            image_url: "https://images.unsplash.com/photo-1541354329998-f4d9a9ac92b8?auto=format&fit=crop&q=80&w=1000",
            total_volume_usdc: 154200,
            yes_pool: 2800,
            no_pool: 4000
        },
        {
            question: "Will Uganda Inflation exceed 6.5% in Feb 2026?",
            description: "Based on UBOS Consumer Price Index (CPI) reports. Current trend: 5.8%.",
            category: "Economics",
            end_date: new Date('2026-02-28').toISOString(),
            image_url: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=1000",
            total_volume_usdc: 89000,
            yes_pool: 2000,
            no_pool: 2000
        },
        {
            question: "Will MTN Uganda (MTNU) share price hit 200 USh by Q2?",
            description: "Stock market prediction based on USE (Uganda Securities Exchange) closing data.",
            category: "Stocks",
            end_date: new Date('2026-06-30').toISOString(),
            image_url: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000",
            total_volume_usdc: 45000,
            yes_pool: 1500,
            no_pool: 1500
        },
        {
            question: "Will Nigeria's CBDC (eNaira) adoption grow by 20% in 2026?",
            description: "Tracking wallet activation metrics from the Central Bank of Nigeria.",
            category: "Crypto",
            end_date: new Date('2026-12-31').toISOString(),
            image_url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=1000",
            total_volume_usdc: 32000,
            yes_pool: 1000,
            no_pool: 1000
        }
    ];

    for (const m of markets) {
        const { data: existing } = await supabase
            .from('markets')
            .select('id')
            .eq('question', m.question)
            .single();

        if (existing) {
            console.log(`⚠️  Skipping (Already Exists): ${m.question}`);
            continue;
        }

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
                outcome_tokens: ["YES", "NO"],
                condition_id: `0x${crypto.randomBytes(32).toString('hex')}`,
                created_at: new Date().toISOString()
            });

        if (error) console.error(`Error Seeding ${m.question}:`, error);
        else console.log(`✅ Seeded: ${m.question}`);
    }
}

seedInstitutionalMarkets();
