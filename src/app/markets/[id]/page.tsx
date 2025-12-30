'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { marketService, Market } from '@/services/marketService';
import { useMarket } from '@/hooks/useMarket';
import { usePrivy } from '@privy-io/react-auth';

export default function MarketPage() {
    const params = useParams();
    const id = params?.id as string;
    const [market, setMarket] = useState<Market | null>(null);
    const [amount, setAmount] = useState('10'); // Default $10 bet
    const { buy } = useMarket();
    const { authenticated, login } = usePrivy();

    useEffect(() => {
        if (id) {
            marketService.getMarketById(id).then(setMarket);
        }
    }, [id]);

    const handleBuy = async (outcomeIndex: number) => {
        if (!authenticated) return login();
        try {
            await buy(outcomeIndex, amount);
            alert('Trade Successful!');
        } catch (e: any) {
            alert('Trade Failed: ' + (e.message || e));
        }
    };

    if (!market) return <div className="min-h-screen bg-black text-white pt-24 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Market Info */}
                    <div>
                        <img src={market.image_url} alt={market.question} className="w-full h-80 object-cover rounded-2xl mb-8" />
                        <h1 className="text-4xl font-bold mb-4">{market.question}</h1>
                        <p className="text-gray-400 text-lg leading-relaxed">{market.description}</p>
                    </div>

                    {/* Right: Trading Interface */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl h-fit sticky top-24">
                        <h2 className="text-2xl font-bold mb-6">Trade Prediction</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Bet Amount (USDC)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleBuy(0)} // Index 0 = Yes (usually)
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 py-4 rounded-xl font-bold text-lg transition-all"
                            >
                                Buy YES
                            </button>
                            <button
                                onClick={() => handleBuy(1)} // Index 1 = No
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-4 rounded-xl font-bold text-lg transition-all"
                            >
                                Buy NO
                            </button>
                        </div>

                        {!authenticated && (
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-400 mb-4">Connect wallet to trade</p>
                                <button
                                    onClick={login}
                                    className="w-full rounded-full bg-emerald-500 py-3 text-black font-bold hover:bg-emerald-400 transition-all"
                                >
                                    Sign In to Trade
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
