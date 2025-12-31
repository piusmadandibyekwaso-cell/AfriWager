'use client';

import { useEffect, useState } from 'react';
import { marketService } from '@/services/marketService';

export default function StatsSection() {
    const [stats, setStats] = useState({
        totalVolume: 0,
        activeTraders: 0,
        payoutSpeed: 'Instant'
    });

    useEffect(() => {
        marketService.getPlatformStats().then(setStats);
    }, []);

    return (
        <section className="mt-12 border-y border-white/5 bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">
                            ${stats.totalVolume.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-500">Total Volume</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {stats.activeTraders.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-500">active traders</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {stats.payoutSpeed}
                        </div>
                        <div className="text-sm text-zinc-500">Payout Speed</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
