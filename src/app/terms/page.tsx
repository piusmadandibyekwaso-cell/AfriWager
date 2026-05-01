'use client';

import Navbar from '@/components/Navbar';
import { Scale, ShieldCheck, Globe, AlertTriangle, Gavel } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-800/50 text-white border border-white/5 mb-8">
                        <Scale className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Terms</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-8">
                        Legal Information
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium">
                        Last Revised: May 2026 • Platform Version 2.4.0
                    </p>
                </div>

                <div className="space-y-12 text-zinc-400 leading-relaxed text-sm md:text-base">
                    {/* SECTION 1 */}
                    <section className="bg-[#0c0e12] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Globe className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">1. Global Operations & Jurisdiction</h2>
                        </div>
                        <p className="mb-6">
                            AfriWager is a decentralized information markets platform. By accessing the platform, you acknowledge that you are operating in a global, peer-to-peer environment. 
                        </p>
                        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl mb-6">
                            <p className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Restricted Jurisdictions
                            </p>
                            <p className="text-xs text-red-400/80 leading-relaxed">
                                Access to AfriWager is strictly prohibited for persons located in the United States or other jurisdictions where prediction markets are restricted by law. You are responsible for ensuring that your participation is legal under your local statutes.
                            </p>
                        </div>
                    </section>

                    {/* SECTION 2 */}
                    <section className="bg-[#0c0e12] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">2. Market Integrity & Anti-Manipulation</h2>
                        </div>
                        <p className="mb-6 font-medium text-zinc-300">
                            To maintain an institutional-grade environment, AfriWager enforces strict Market Integrity Rules:
                        </p>
                        <ul className="space-y-4 list-none">
                            {[
                                { title: 'Wash Trading', desc: 'Executing trades where there is no change in beneficial ownership is strictly prohibited.' },
                                { title: 'Spoofing', desc: 'Placing and cancelling orders to create a false appearance of market depth is a violation of platform rules.' },
                                { title: 'Insider Information', desc: 'Trading based on non-public, material information regarding an event outcome is prohibited.' },
                                { title: 'Self-Dealing', desc: 'Users may not trade against themselves using multiple accounts or wallets.' }
                            ].map((rule, i) => (
                                <li key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-emerald-500 font-black text-xs mt-1">0{i+1}</div>
                                    <div>
                                        <p className="text-white font-bold text-sm mb-1">{rule.title}</p>
                                        <p className="text-xs text-zinc-500">{rule.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 3 */}
                    <section className="bg-[#0c0e12] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Gavel className="w-5 h-5 text-purple-500" />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">3. Guardian Protocol & Resolution</h2>
                        </div>
                        <p className="mb-6">
                            Markets on AfriWager are resolved via the **Guardian Protocol**—a decentralized oracle system that utilizes verifiable, public data sources.
                        </p>
                        <div className="space-y-4">
                            <div className="p-5 border-l-2 border-emerald-500 bg-emerald-500/5 rounded-r-xl">
                                <p className="text-sm font-bold text-white mb-2">Finality of Resolution</p>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Once a market is settled by the Guardian Protocol, the resolution is immutable. In the event of an ambiguity in the resolution source, the platform reserves the right to delay settlement for up to 72 hours for manual audit.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4 */}
                    <section className="bg-[#0c0e12] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                        <h2 className="text-xl font-black text-white tracking-tight uppercase mb-6">4. Risk Disclosure</h2>
                        <p className="mb-6 text-zinc-400">
                            Trading on AfriWager involves significant risk of loss. Probabilities displayed on the platform are based on market activity and do not constitute financial advice or guarantees of event outcomes.
                        </p>
                        <p className="text-xs italic text-zinc-600">
                            By clicking "I Agree" or using the platform, you verify that you have read and understood the risks associated with peer-to-peer event contracts.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
