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
            <div className="bg-[#0c0e12] border border-zinc-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xl font-black text-white tracking-tighter">
                    {(payload[0].value * 100).toFixed(1)}¢
                </p>
            </div>
        );
    }
    return null;
};

export default function PriceChart({ data, color = "#10b981" }: PriceChartProps) {
    return (
        <div className="w-full h-[300px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} opacity={0.2} />
                    <XAxis
                        dataKey="time"
                        hide={true}
                    />
                    <YAxis
                        domain={[0, 1]}
                        hide={true}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
