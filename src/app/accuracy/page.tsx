import Navbar from '@/components/Navbar';
import { Target, ShieldCheck } from 'lucide-react';

export default function AccuracyPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-6">
                        <Target className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Market Accuracy</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 uppercase italic">
                        Unmatched Predictive Precision
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        AfriWager is built on the principle that financial stakes yield the most accurate forecasts. By aggregating the collective intelligence and capital of thousands of market participants, we provide the most reliable probabilities for African political, economic, and cultural events.
                    </p>
                </div>

                <div className="bg-[#0c0e12] border border-white/5 p-10 rounded-3xl shadow-2xl mt-12">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mb-6" />
                    <h3 className="text-2xl font-black mb-4">How it Works</h3>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                        Unlike traditional polling which relies on stated intentions without consequence, prediction markets require participants to put money on the line. This creates a powerful incentive to seek truth, resulting in highly calibrated probabilities that consistently outperform pundits and experts.
                    </p>
                    <div className="p-6 bg-black rounded-2xl border border-white/5 border-l-emerald-500 border-l-4">
                        <p className="text-sm font-bold text-white uppercase tracking-widest italic">"Markets are the ultimate truth-seeking mechanism."</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
