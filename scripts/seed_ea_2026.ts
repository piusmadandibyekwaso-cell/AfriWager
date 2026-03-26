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

const ea_markets = [
    { id: "ea_ug_who", q: "Will the WHO AWaRe antibiotics guidelines be officially adopted by the Ugandan Parliament in Q2 2026?", d: "Healthcare policy tracking.", c: "Politics", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ug_statue", q: "Will General Muhoozi Kainerugaba build the Yonatan Netanyahu statue in Entebbe before the end of 2026?", d: "Geopolitical and military relations tracking.", c: "Politics", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ug_bobi", q: "Will opposition leader Bobi Wine return to Uganda from exile before December 2026?", d: "Political stability and opposition dynamics in Uganda.", c: "Politics", end: "2026-11-30T00:00:00Z" },
    { id: "ea_ug_fuel", q: "Will Uganda's fuel reserves drop below 30 days of supply by May 2026 due to the Middle East conflict?", d: "Energy security and economic resilience.", c: "Economics", end: "2026-05-31T00:00:00Z" },
    { id: "ea_ug_export", q: "Will Uganda's merchandise export growth exceed 80% year-on-year in Q2 2026?", d: "Macroeconomic performance indicator.", c: "Economics", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ug_vipers", q: "Will Vipers SC emerge as the 2025/2026 StarTimes Uganda Premier League Champions by May 23?", d: "Uganda Premier League title race.", c: "Sports", end: "2026-05-23T00:00:00Z" },
    { id: "ea_ug_kcca", q: "Will KCCA FC finish in the top 3 of the 2025/2026 Uganda Premier League?", d: "UPL top 3 finishers.", c: "Sports", end: "2026-05-23T00:00:00Z" },
    { id: "ea_ug_villa", q: "Will SC Villa win the 52nd Stanbic Uganda Cup Final?", d: "Uganda Cup knockouts.", c: "Sports", end: "2026-05-31T00:00:00Z" },
    { id: "ea_ug_refs", q: "Will the suspended FUFA referees be reinstated before the end of the UPL season?", d: "FUFA disciplinary action tracking.", c: "Sports", end: "2026-05-23T00:00:00Z" },
    { id: "ea_ug_hoima", q: "Will Uganda U18 Basketball win the FIBA Zone V tournament in Hoima in June 2026?", d: "Youth basketball regional tracking.", c: "Sports", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ug_litd", q: "Will the 'Lights in The Dark' storytelling event record over 10,000 attendees at the Uganda National Theatre?", d: "Cultural event attendance metrics.", c: "Culture", end: "2026-04-30T00:00:00Z" },
    { id: "ea_ug_afro", q: "Will a Ugandan artist break into the top 50 global Afrobeats charts by September 2026?", d: "Ugandan music global penetration.", c: "Culture", end: "2026-09-30T00:00:00Z" },
    { id: "ea_ug_marathon", q: "Will the 2nd Mbarara City Marathon record over 5,000 official runners?", d: "Sports and culture participation.", c: "Culture", end: "2026-04-30T00:00:00Z" },
    { id: "ea_ke_gachagua", q: "Will Deputy President Rigathi Gachagua officially resign or be impeached in 2026?", d: "Kenyan political stability and executive relations.", c: "Politics", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ke_uda", q: "Will President William Ruto's UDA successfully force a merger with Moses Wetang'ula's Ford Kenya before 2027?", d: "Coalition politics in Kenya.", c: "Politics", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ke_strikes", q: "Will the opposition lead nationwide strikes demanding IEBC electoral reforms in Q2 2026?", d: "Electoral reform tensions in Kenya.", c: "Politics", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ke_floods", q: "Will the Kenyan government issue emergency compensation for Nairobi flood victims exceeding KES 1B by May 2026?", d: "Climate crisis response.", c: "Economics", end: "2026-05-31T00:00:00Z" },
    { id: "ea_ke_flowers", q: "Will Kenya's flower export losses exceed $5M per week by June 2026 due to the Iran conflict logistics?", d: "Agricultural export impact.", c: "Economics", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ke_starlets", q: "Will Kenya's Harambee Starlets win the inaugural FIFA Women's Series tournament in Nairobi in April 2026?", d: "Women's international football.", c: "Sports", end: "2026-04-30T00:00:00Z" },
    { id: "ea_ke_golf", q: "Will Kenyan golfer Njoroge Kibugu rank in the top 100 of the Official World Golf Ranking (OWGR) by the end of 2026?", d: "International golf achievements.", c: "Sports", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ke_stadium", q: "Will the Talanta City Stadium construction reach 50% completion by December 2026?", d: "AFCON 2027 infrastructure readiness.", c: "Sports", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ke_azziad", q: "Will influencer Azziad Nasenya win at the Thamani Africa Awards 2026?", d: "Digital influencer awards.", c: "Culture", end: "2026-06-30T00:00:00Z" },
    { id: "ea_ke_kalasha", q: "Will the broadcast of the 14th Kalasha International Film and TV Awards exceed 1 million live viewers?", d: "Kenyan entertainment viewership.", c: "Culture", end: "2026-05-31T00:00:00Z" },
    { id: "ea_sa_masemola", q: "Will National Police Commissioner Fannie Masemola be officially convicted of corruption charges in 2026?", d: "South African governance and justice.", c: "Politics", end: "2026-12-31T00:00:00Z" },
    { id: "ea_sa_da", q: "Will the Democratic Alliance (DA) win a vote of no confidence against Masemola?", d: "Parliamentary dynamics in South Africa.", c: "Politics", end: "2026-06-30T00:00:00Z" },
    { id: "ea_sa_afcon", q: "Will South Africa officially host the 2026 Women's AFCON tournament after Morocco's delays?", d: "CAF tournament hosting rights.", c: "Sports", end: "2026-07-31T00:00:00Z" },
    { id: "ea_sa_proteas", q: "Will the Proteas (Men's Cricket) win the T20 World Cup 2026?", d: "International cricket tournament.", c: "Sports", end: "2026-11-30T00:00:00Z" },
    { id: "ea_ng_opl", q: "Will the Federal Government successfully resolve the remaining OPL 245 disputes by December 2026?", d: "Nigerian oil sector legal disputes.", c: "Politics", end: "2026-12-31T00:00:00Z" },
    { id: "ea_ng_wheelchair", q: "Will the Nigerian wheelchair basketball team win the Commonwealth Games qualifiers in Angola?", d: "Para-sports international qualifiers.", c: "Sports", end: "2026-04-30T00:00:00Z" },
    { id: "ea_ng_osimhen", q: "Will Victor Osimhen transfer from Napoli to an English Premier League club in the Summer 2026 window?", d: "Football transfer market.", c: "Sports", end: "2026-08-31T00:00:00Z" }
];

async function seedEA() {
    console.log('🧹 Purging all existing legacy markets to make room for local markets...');
    const { error: delErr } = await supabase.from('markets').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Wipe all
    if (delErr) {
        console.log("⚠️ Deletion warning (maybe FK constraint):", delErr.message);
    } else {
        console.log("✅ Deletion complete.");
    }

    console.log(`🚀 Seeding ${ea_markets.length} new localized East Africa markets...`);
    let baseVol = 850000;
    
    for (const m of ea_markets) {
        const { data: existing } = await supabase
            .from('markets')
            .select('id')
            .eq('question', m.q)
            .single();

        if (existing) {
            console.log(`⚠️  Skipping (Already Exists): ${m.q}`);
            continue;
        }

        const yesP = Math.floor((baseVol / 2) * 0.55); // Slightly favor Yes
        const noP = Math.floor((baseVol / 2) * 0.45);

        const { error } = await supabase
            .from('markets')
            .insert({
                question: m.q,
                description: m.d,
                category: m.c,
                end_date: m.end,
                image_url: `/market-images/ea/${m.id}.svg`,
                total_volume_usdc: baseVol,
                yes_pool: yesP,
                no_pool: noP,
                outcome_tokens: ["Yes", "No"],
                condition_id: `0x${crypto.randomBytes(32).toString('hex')}`,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error(`❌ Error Seeding ${m.q}:`, error);
        } else {
            console.log(`✅ Seeded: ${m.q} (${m.c})`);
        }
        
        baseVol = Math.max(15000, Math.floor(baseVol * 0.85)); // Decay volume for the next
    }
}

seedEA();
