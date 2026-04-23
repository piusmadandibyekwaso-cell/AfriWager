import Navbar from '@/components/Navbar';
import { FileText, BookOpen, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-800 text-white border border-white/10 mb-6">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Documentation</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 uppercase italic">
                        AfriWager Knowledge Base
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Everything you need to know about trading, resolving markets, and building on AfriWager's infrastructure.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <Link href="/docs/trading" className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all cursor-pointer block">
                        <FileText className="w-8 h-8 text-emerald-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">Trading Guide</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Learn how to read probabilities, place orders, and manage risk using the AfriVault ledger.
                        </p>
                    </Link>

                    <Link href="/docs/resolution" className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-blue-500/30 transition-all cursor-pointer block">
                        <Shield className="w-8 h-8 text-blue-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">Market Resolution</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Understand how markets are settled and the oracle mechanics ensuring objective truth.
                        </p>
                    </Link>
                    
                    <Link href="/docs/faq" className="bg-[#0c0e12] border border-white/5 p-8 rounded-3xl group hover:border-purple-500/30 transition-all cursor-pointer block md:col-span-2">
                        <HelpCircle className="w-8 h-8 text-purple-500 mb-6" />
                        <h3 className="text-xl font-black mb-3">Frequently Asked Questions</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Quick answers to common questions regarding fees, withdrawals, and account security.
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
