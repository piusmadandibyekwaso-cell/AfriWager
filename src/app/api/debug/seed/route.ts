import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This is a temporary route to seed the 25 strategic markets. 
// It will be removed after execution.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Use service role if available for bulk insert

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const marketsToSeed = [
            // 1. NIGERIA ECONOMY
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                condition_id: 'NGN_USD_1510_JUNE_2026',
                question: 'Will the Official NGN/USD rate close above ₦1,510 on June 30, 2026?',
                description: 'Based on Central Bank of Nigeria (CBN) official closing rate.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1621259182978-f09e5e2ca1ec?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-06-30T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 12500
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                condition_id: 'NG_INFLATION_15_DEC_2026',
                question: 'Will Nigeria\'s Year-on-Year Inflation fall below 15% before Dec 2026?',
                description: 'Based on National Bureau of Statistics (NBS) monthly report.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1579532566591-953b6c70c0c2?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 8400
            },
            // 2. UGANDA CURRENCY
            {
                id: '550e8400-e29b-41d4-a716-446655440003',
                condition_id: 'UGX_USD_3000_2026',
                question: 'Will the USD/UGX exchange rate fall below 3,000 at any point in 2026?',
                description: 'Based on Bank of Uganda official rates.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1593672715438-d88a7536f230?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 5200
            },
            // 3. JOSHUA BARAKA
            {
                id: '550e8400-e29b-41d4-a716-446655440004',
                condition_id: 'JOSHUA_BARAKA_GRAMMY_NOM_2026',
                question: 'Will Joshua Baraka receive a Grammy Nomination in late 2026 (for 2027 awards)?',
                description: 'Based on Recording Academy official announcements.',
                category: 'Pop Culture',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-11-30T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 15400
            },
            // 4. WORLD CUP 
            {
                id: '550e8400-e29b-41d4-a716-446655440005',
                condition_id: 'WC_2026_AFRICAN_TEAMS_KNOCKOUT',
                question: 'Will at least 3 African nations qualify for the Round of 32 in the 2026 World Cup?',
                description: 'Advancing past the group stage. Based on FIFA official results.',
                category: 'Sports',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-06-25T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 45000
            },
            // 5. STARLINK
            {
                id: '550e8400-e29b-41d4-a716-446655440006',
                condition_id: 'STARLINK_AFRICA_40_COUNTRIES_2026',
                question: 'Will Starlink be officially live in at least 40 African countries by Dec 31, 2026?',
                description: 'Based on Starlink Availability Map.',
                category: 'Technology',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 18900
            },
            // 6. AFCON FINAL
            {
                id: '550e8400-e29b-41d4-a716-446655440007',
                condition_id: 'AFCON_2025_WINNER_JAN_2026',
                question: 'Who will win the AFCON Final (played Jan 18, 2026)?',
                description: 'Based on CAF official results.',
                category: 'Sports',
                outcome_tokens: ['Nigeria', 'South Africa', 'Morocco', 'Senegal', 'Other'],
                image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-01-18T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 56000
            },
            // 7. SOUTH AFRICA ELECTIONS
            {
                id: '550e8400-e29b-41d4-a716-446655440008',
                condition_id: 'ANC_MAJORITY_SA_2026',
                question: 'Will the ANC win more than 40% of the total vote in the 2026 Municipal Elections?',
                description: 'Based on IEC South Africa final results.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1540910419316-ce7467389178?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-11-30T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 32000
            },
            // 9. GRAMMYS
            {
                id: '550e8400-e29b-41d4-a716-446655440009',
                condition_id: 'GRAMMYS_AFRICAN_WIN_2026',
                question: 'Will a Nigerian artist win \'Best African Music Performance\' at the 2026 Grammys?',
                description: 'Based on official Grammy.com winners.',
                category: 'Pop Culture',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1514525253361-bee8d4ca8121?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-02-01T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 21000
            },
            // 10. SA MUNICIPAL MK
            {
                id: '550e8400-e29b-41d4-a716-446655440010',
                condition_id: 'MK_PARTY_SA_MUN_2026',
                question: 'Will the MK Party win the majority in at least 3 municipalities in 2026?',
                description: 'Based on IEC South Africa results.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1577493322601-3ae1ef45ee3d?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-11-30T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 15000
            },
            // 11. CRICKET
            {
                id: '550e8400-e29b-41d4-a716-446655440011',
                condition_id: 'SA_PROTEAS_T20_FINAL_2026',
                question: 'Will the South African Proteas reach the Final of the 2026 T20 World Cup?',
                description: 'Based on ICC official results.',
                category: 'Sports',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-11-15T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 12000
            },
            // 12. CABINET RESHUFFLE
            {
                id: '550e8400-e29b-41d4-a716-446655440012',
                condition_id: 'NG_CABINET_RESHUFFLE_2026',
                question: 'Will President Tinubu replace at least 3 ministers before May 29, 2026?',
                description: 'Based on official Presidency announcements.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-05-29T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 9000
            },
            // 13. BITCOIN ADOPTION
            {
                id: '550e8400-e29b-41d4-a716-446655440013',
                condition_id: 'AFRICA_BITCOIN_LEGAL_TENDER_2026',
                question: 'Will another African country make Bitcoin legal tender in 2026?',
                description: 'Excluding Central African Republic (CAR).',
                category: 'Crypto',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 14000
            },
            // 14. NAIRA STABLECOIN
            {
                id: '550e8400-e29b-41d4-a716-446655440014',
                condition_id: 'NG_SEC_NAIRA_STABLECOIN_2026',
                question: 'Will Nigeria\'s SEC approve a local Naira-backed stablecoin in 2026?',
                description: 'Official circular from Nigeria Securities and Exchange Commission.',
                category: 'Crypto',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 11000
            },
            // 15. SA STARTUP ACT
            {
                id: '550e8400-e29b-41d4-a716-446655440015',
                condition_id: 'SA_STARTUP_ACT_PASS_2026',
                question: 'Will South Africa officially pass the "Startup Act" into law in 2026?',
                description: 'Bill signed by the President.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1454165833767-027ff33027ef?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 7500
            },
            // 16. AU PASSPORT
            {
                id: '550e8400-e29b-41d4-a716-446655440016',
                condition_id: 'AU_PASSPORT_LAUNCH_2026',
                question: 'Will the African Union launch a biometric AU Passport for citizens in 2026?',
                description: 'Based on AU Summit communique.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1554992259-ceba5fcb0e41?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 6000
            },
            // 17. LOADSHEDDING
            {
                id: '550e8400-e29b-41d4-a716-446655440017',
                condition_id: 'SA_LOADSHEDDING_100_DAYS_2026',
                question: 'Will South Africa go 100 consecutive days without Loadshedding in 2026?',
                description: 'Based on Eskom live data.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 25000
            },
            // 18. LAGOS 2027
            {
                id: '550e8400-e29b-41d4-a716-446655440018',
                condition_id: 'SEYI_TINUBU_LAGOS_DECLARATION_2026',
                question: 'Will Seyi Tinubu declare his candidacy for Lagos Governor before Dec 2026?',
                description: 'Official press release or verified video announcement.',
                category: 'Politics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1518391846015-55a9cb00bb86?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-15T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 18000
            },
            // 19. FUEL PRICES
            {
                id: '550e8400-e29b-41d4-a716-446655440019',
                condition_id: 'NG_FUEL_PRICE_1200_2026',
                question: 'Will the retail price of PMS (Petrol) in Lagos exceed ₦1,200/liter by July 2026?',
                description: 'NNPCL official pricing.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1610492421943-88d2f38f11e6?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-07-01T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 13500
            },
            // 20. RUGBY
            {
                id: '550e8400-e29b-41d4-a716-446655440020',
                condition_id: 'SPRINGBOKS_WORLD_NO1_DEC_2026',
                question: 'Will the Springboks hold the #1 World Rugby Ranking on Dec 31, 2026?',
                description: 'World Rugby official rankings.',
                category: 'Sports',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 11500
            },
            // 21. LAGOS TECH FEST
            {
                id: '550e8400-e29b-41d4-a716-446655440021',
                condition_id: 'LAGOS_TECH_FEST_ATTENDANCE_10K_2026',
                question: 'Will Lagos Tech Fest 2026 break its attendance record (Target 10k+)?',
                description: 'Official event organizer report.',
                category: 'Technology',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-02-28T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 4200
            },
            // 22. GLOVO AFRICA
            {
                id: '550e8400-e29b-41d4-a716-446655440022',
                condition_id: 'GLOVO_NIGERIA_EXIT_2026',
                question: 'Will Glovo officially exit the Nigerian market in 2026?',
                description: 'Official corporate announcement.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 5800
            },
            // 23. ZIMBABWE GOLD
            {
                id: '550e8400-e29b-41d4-a716-446655440023',
                condition_id: 'ZIM_GOLD_CURRENCY_USD_05_2026',
                question: 'Will Zimbabwe\'s Gold-backed currency (ZiG) trade above $0.05 USD in 2026?',
                description: 'Official ZiG/USD interbank rate.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 3900
            },
            // 24. AFROBEATS HOT 100
            {
                id: '550e8400-e29b-41d4-a716-446655440024',
                condition_id: 'AFROBEATS_TOP_10_BILLBOARD_2026',
                question: 'Will an Afrobeats track reach the Billboard Hot 100 Top 10 in 2026?',
                description: 'Official Billboard charts.',
                category: 'Pop Culture',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 24000
            },
            // 25. WORLD BANK GROWTH
            {
                id: '550e8400-e29b-41d4-a716-446655440025',
                condition_id: 'AFRICA_GDP_GROWTH_4_2026',
                question: 'Will Sub-Saharan Africa average GDP growth exceed 4.0% in 2026?',
                description: 'Based on World Bank Global Economic Prospects.',
                category: 'Economics',
                outcome_tokens: ['Yes', 'No'],
                image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
                end_date: '2026-12-31T23:59:59Z',
                status: 'OPEN',
                total_volume_usdc: 12000
            }
        ];

        // Seeding loop
        for (const m of marketsToSeed) {
            // Check if exists
            const { data: existing } = await supabase.from('markets').select('id').eq('condition_id', m.condition_id).single();
            if (existing) continue;

            const { error } = await supabase.from('markets').insert(m);
            if (error) console.error(`Error inserting ${m.condition_id}:`, error);

            // Seed outcomes
            const outcomeObjs = m.outcome_tokens.map((name, index) => ({
                market_id: m.id,
                name,
                index,
                initial_probability: index === 0 ? 0.6 : 0.4, // Simplified
                current_probability: index === 0 ? 0.6 : 0.4,
                price: index === 0 ? 0.6 : 0.4
            }));
            await supabase.from('outcomes').insert(outcomeObjs);
        }

        return NextResponse.json({ success: true, seeded: marketsToSeed.length });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
