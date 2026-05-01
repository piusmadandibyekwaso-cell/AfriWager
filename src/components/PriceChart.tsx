'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface ChartDataPoint {
    time: string;
    price: number;
}

interface PriceChartProps {
    data: ChartDataPoint[];
    color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-3xl">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-lg font-black text-white tracking-tighter">
                    {(payload[0].value * 100).toFixed(1)}%
                </p>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 italic">Market Consensus</p>
            </div>
        );
    }
    return null;
};

export default function PriceChart({ data, color = "#10b981" }: PriceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 animate-pulse">
                <span className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.3em]">Analyzing Market Trends...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.03} />
                    <XAxis
                        dataKey="time"
                        hide={true}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        hide={true}
                    />
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} 
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
