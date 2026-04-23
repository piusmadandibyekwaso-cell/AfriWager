import Navbar from '@/components/Navbar';
import { Scale } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-800 text-white border border-white/10 mb-6">
                        <Scale className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Terms of Use</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                        Legal Information
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Last Updated: April 2026
                    </p>
                </div>

                <div className="bg-[#0c0e12] border border-white/5 p-10 rounded-3xl shadow-2xl mt-8 space-y-8 text-zinc-400 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-black text-white mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using AfriWager, you agree to be bound by these Terms of Use and all applicable laws and regulations in your jurisdiction.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-black text-white mb-4">2. Eligibility</h2>
                        <p>You must be at least 18 years old to use this platform. AfriWager operates in compliance with local regulations; it is your responsibility to ensure that your use of the platform is legal in your jurisdiction.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-black text-white mb-4">3. Market Risks</h2>
                        <p>Trading Event Contracts involves substantial risk. Probabilities do not guarantee outcomes. AfriWager is not responsible for any financial losses incurred while trading on the platform.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-black text-white mb-4">4. Resolution Integrity</h2>
                        <p>AfriWager uses designated oracles to resolve markets. All resolutions are final once confirmed. Disputing market resolutions must follow the documented appeals process within 24 hours of settlement.</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
