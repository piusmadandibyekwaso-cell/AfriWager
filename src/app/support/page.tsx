import Navbar from '@/components/Navbar';
import { Headset, MessageSquare, Bot } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-6">
                        <Headset className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Support Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 uppercase italic">
                        How can we help?
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Our support team and AI agents are available 24/7 to assist you with trading, account issues, and market resolutions.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <div className="bg-gradient-to-br from-[#0c0e12] to-emerald-900/10 border border-emerald-500/20 p-10 rounded-3xl shadow-2xl flex flex-col justify-between">
                        <div>
                            <Bot className="w-12 h-12 text-emerald-500 mb-6" />
                            <h3 className="text-2xl font-black mb-4">AfriWager AI Agent</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Get instant answers to your questions. Our AI is trained on all market data, trading rules, and platform mechanics.
                            </p>
                        </div>
                        <button className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-400 transition-colors">
                            Chat with AI
                        </button>
                    </div>

                    <div className="bg-[#0c0e12] border border-white/5 p-10 rounded-3xl shadow-2xl flex flex-col justify-between">
                        <div>
                            <MessageSquare className="w-12 h-12 text-white/40 mb-6" />
                            <h3 className="text-2xl font-black mb-4">Human Support</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                For complex account issues, KYC verification, or escalating market disputes, open a ticket with our resolution team.
                            </p>
                        </div>
                        <button className="w-full py-4 bg-white/5 text-white border border-white/10 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-colors">
                            Open Ticket
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
