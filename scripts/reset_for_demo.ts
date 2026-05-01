import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log("🚀 Starting Institutional Demo Reset...");
    
    try {
        // 1. Wipe old data (Foreign keys cascade or manual delete)
        console.log("Cleaning old ledger data...");
        await supabase.from('trades').delete().neq('tx_hash', 'SEED');
        await supabase.from('outcomes').delete().neq('name', 'SEED');
        await supabase.from('market_prices').delete().neq('id', 0);
        await supabase.from('compliance_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('positions').delete().neq('id', 0);
        
        const { error: delError } = await supabase.from('markets').delete().neq('question', 'SEED');
        if (delError) throw delError;

        console.log("Database scrubbed successfully.");

        // 2. Insert 3 Institutional Markets
        const markets = [
            {
                condition_id: 'uganda_parliament_speakership_2026',
                question: 'Parliament of Uganda: Will Anita Among be re-elected as Speaker of the 12th Parliament?',
                description: 'This market resolves to "Yes" if Anita Annet Among is successfully elected as the Speaker of the 12th Parliament of Uganda following the May 2026 internal NRM and Parliamentary votes.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                end_date: '2026-05-31T23:59:59Z',
                yes_pool: 1000,
                no_pool: 1000,
                total_volume_usdc: 0,
                status: 'OPEN'
            },
            {
                condition_id: 'osimhen_transfer_london_bound',
                question: 'Will Victor Osimhen transfer to an English Premier League club in Summer 2026?',
                description: 'This market resolves to "Yes" if Victor Osimhen completes a permanent or loan transfer to any club in the English Premier League during the Summer 2026 transfer window.',
                category: 'Sports',
                outcome_tokens: ['Yes', 'No'],
                end_date: '2026-08-31T23:59:59Z',
                yes_pool: 1000,
                no_pool: 1000,
                total_volume_usdc: 0,
                status: 'OPEN'
            },
            {
                condition_id: 'muhoozi_statue_completion',
                question: 'Will General Muhoozi build the Yonatan Netanyahu statue in Entebbe by end of 2026?',
                description: 'This market resolves to "Yes" if a monument dedicated to Yonatan Netanyahu is officially unveiled in Entebbe, Uganda by Dec 31, 2026.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                end_date: '2026-12-31T23:59:59Z',
                yes_pool: 1000,
                no_pool: 1000,
                total_volume_usdc: 0,
                status: 'OPEN'
            }
        ];

        const { data: insertedMarkets, error: insError } = await supabase.from('markets').insert(markets).select();
        if (insError) throw insError;
        
        if (insertedMarkets) {
            for (const m of insertedMarkets) {
                 const outcomes = [
                     { market_id: m.id, name: 'Yes', index: 0, initial_probability: 0.5, current_probability: 0.5, price: 0.5 },
                     { market_id: m.id, name: 'No', index: 1, initial_probability: 0.5, current_probability: 0.5, price: 0.5 }
                 ];
                 const { error: outError } = await supabase.from('outcomes').insert(outcomes);
                 if (outError) console.error(`Error inserting outcomes for ${m.question}:`, outError);
            }
        }

        console.log("✅ DONE! Platform is now LIVE with 3 clean, institutional markets.");
        process.exit(0);

    } catch (e) {
        console.error("FAILED to reset platform:", e);
        process.exit(1);
    }
}

reset();
