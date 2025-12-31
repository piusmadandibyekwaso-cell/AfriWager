'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Trophy, Wallet } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { label: 'Markets', icon: LayoutDashboard, href: '/markets' },
    { label: 'Activity', icon: Activity, href: '/activity' },
    { label: 'Ranks', icon: Trophy, href: '/ranks' },
    { label: 'Wallet', icon: Wallet, href: '/funds' },
];

export default function MobileNavbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/5 md:hidden px-6 pb-6 pt-4 safe-area-inset-bottom">
            <div className="flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className={cn(
                                "p-2 rounded-2xl transition-all duration-300",
                                isActive ? "bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10" : "text-zinc-500 group-hover:text-zinc-300"
                            )}>
                                <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-colors",
                                isActive ? "text-white" : "text-zinc-600"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
